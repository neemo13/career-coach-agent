"""
WHAT  - answers a user's free-form question about their own career analysis,
        grounded in the stored analysis + the user's single global learning
        plan (if any) + recent chat history. After each reply, asks
        app/agents/career_agent.py whether the plan should now be created
        or added to.
WHY   - kept out of app/api/coach.py (HTTP concerns only). Decision logic
        stays in agents/, the actual generation call stays in tools/.
HOW   - app/api/coach.py calls send_message(user_id, analysis_id, message)
        and get_history(user_id, analysis_id).
"""

from fastapi import HTTPException, status

from app.core.supabase_client import supabase
from app.core.llm_provider import get_llm_provider, generate_structured_with_retry
from app.schemas.coach import ChatReply
from app.agents.career_agent import decide_next_step, CONFIRMATION_PROMPT, UPDATE_CONFIRMATION_PROMPT
from app.tools.learning_plan_tool import run_learning_plan

MAX_HISTORY_MESSAGES = 10

COACH_PROMPT_TEMPLATE = """You are a career coach helping a fresher (early-career candidate) evaluate
and prepare for a specific job opportunity, grounded in their actual analysis below.

How to respond:
- Answer the user's actual question first, directly and specifically, using the analysis context.
- Ask at most one follow-up question, and only when the answer would genuinely change your advice.
  Do NOT end every reply with a question - most replies should just be a complete answer.
- If the user volunteers something relevant - coursework, a technology they prefer or want to skip,
  target role, available time, or a deadline - factor it into this conversation's advice.
- You are reasoning only about THIS analysis and THIS conversation - do not assume knowledge of
  the user's other job analyses beyond what they explicitly tell you here.
- Keep answers conversational and concise.

Also decide: does the user's NEW message clearly ask you to add skills to/generate their learning
plan, or clearly confirm that they want that done now? Set wants_learning_plan to true only for
an unmistakable request or confirmation - NOT for exploratory questions like "what should I learn
first?", which should get wants_learning_plan = false even though they're plan-adjacent.

CAREER ANALYSIS CONTEXT:
Match score: {match_score}%
Summary: {summary}
Matching skills: {matching_skills}
Missing skills: {missing_skills}
Strengths: {strengths}
Weaknesses: {weaknesses}
Recommendations: {recommendations}
Your current learning plan so far (across all analyses): {learning_plan}

RECENT CONVERSATION:
{history}

USER'S NEW MESSAGE:
{question}
"""


def _fetch_owned_analysis(analysis_id: str, user_id: str) -> dict:
    result = (
        supabase.table("analyses")
        .select("*")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
    return result.data


def _fetch_job_text(job_description_id: str, user_id: str) -> str:
    result = (
        supabase.table("job_descriptions")
        .select("raw_text")
        .eq("id", job_description_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    return result.data["raw_text"] if result.data else ""


def _fetch_global_plan(user_id: str) -> dict | None:
    result = (
        supabase.table("career_plans")
        .select("id, plan")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data if result and result.data else None


def _fetch_plan_text(user_id: str) -> tuple[str, bool]:
    row = _fetch_global_plan(user_id)
    if not row:
        return "(none generated yet)", False
    items = row["plan"]
    text = "; ".join(
        f"{item['skill']} (priority: {item['priority']}, order: {item['order']})" for item in items
    )
    return text, True


def _merge_plan_items(existing_items: list[dict], new_items: list[dict]) -> list[dict]:
    """
    Merges newly generated items into the user's existing global plan by
    skill name (case-insensitive): a skill already tracked keeps its
    completed/user_notes progress but gets refreshed priority/area/
    difficulty/term/resources; a new skill is added fresh. The combined
    list is re-sequenced into a clean 1..N order (short-term first, then
    long-term) so `order` stays meaningful after merging plans built from
    different conversations/analyses over time.
    """
    by_skill = {item["skill"].strip().lower(): item for item in existing_items}
    for new_item in new_items:
        key = new_item["skill"].strip().lower()
        if key in by_skill:
            preserved = {
                "completed": by_skill[key].get("completed", False),
                "user_notes": by_skill[key].get("user_notes", ""),
            }
            by_skill[key] = {**new_item, **preserved}
        else:
            by_skill[key] = {**new_item, "completed": False, "user_notes": ""}
    merged = list(by_skill.values())
    merged.sort(key=lambda i: (i["term"] == "long_term", i["order"]))
    for idx, item in enumerate(merged, start=1):
        item["order"] = idx
    return merged


def _fetch_recent_history(analysis_id: str, user_id: str) -> list[dict]:
    result = (
        supabase.table("coach_messages")
        .select("role, content, created_at")
        .eq("analysis_id", analysis_id)
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(MAX_HISTORY_MESSAGES)
        .execute()
    )
    return list(reversed(result.data)) if result.data else []


def _maybe_insert_kickoff_message(analysis: dict, analysis_id: str, user_id: str) -> None:
    history = _fetch_recent_history(analysis_id, user_id)
    if history:
        return
    missing = analysis.get("missing_skills") or []
    if not missing:
        return
    content = (
        f"I looked at your analysis - you're missing {', '.join(missing)}. "
        "Want to talk through which to prioritize, or should we add them to your learning plan?"
    )
    supabase.table("coach_messages").insert(
        {"analysis_id": analysis_id, "user_id": user_id, "role": "assistant", "content": content}
    ).execute()


def send_message(user_id: str, analysis_id: str, message: str) -> dict:
    analysis = _fetch_owned_analysis(analysis_id, user_id)
    plan_text, plan_exists = _fetch_plan_text(user_id)
    history = _fetch_recent_history(analysis_id, user_id)

    previous_assistant_message = None
    for m in reversed(history):
        if m["role"] == "assistant":
            previous_assistant_message = m["content"]
            break

    history_text = (
        "\n".join(f"{m['role']}: {m['content']}" for m in history) if history else "(none yet)"
    )

    prompt = COACH_PROMPT_TEMPLATE.format(
        match_score=analysis["match_score"],
        summary=analysis["summary"],
        matching_skills=", ".join(analysis["matching_skills"]),
        missing_skills=", ".join(analysis["missing_skills"]),
        strengths=", ".join(analysis["strengths"]),
        weaknesses=", ".join(analysis["weaknesses"]),
        recommendations=", ".join(analysis["recommendations"]),
        learning_plan=plan_text,
        history=history_text,
        question=message,
    )

    provider = get_llm_provider()
    parsed = generate_structured_with_retry(provider, prompt, ChatReply)

    decision = decide_next_step(
        wants_learning_plan_signal=parsed.wants_learning_plan,
        previous_assistant_message=previous_assistant_message,
        user_message=message,
        missing_skills=analysis["missing_skills"],
        plan_already_exists=plan_exists,
    )

    reply_text = parsed.reply
    if decision == "ask_confirmation":
        reply_text = CONFIRMATION_PROMPT
    elif decision == "ask_update_confirmation":
        reply_text = UPDATE_CONFIRMATION_PROMPT
    elif decision in ("generate_plan", "update_plan"):
        job_text = _fetch_job_text(analysis["job_description_id"], user_id)
        plan_result = run_learning_plan(analysis["missing_skills"], job_text, history_text)
        new_items = [item.model_dump() for item in plan_result.items]

        if decision == "generate_plan":
            plan_items = [{**item, "completed": False, "user_notes": ""} for item in new_items]
            op_result = supabase.table("career_plans").insert(
                {"user_id": user_id, "analysis_id": analysis_id, "plan": plan_items}
            ).execute()
            confirmation_text = " I've created your learning plan - check the Learning Plan page."
        else:
            existing_row = _fetch_global_plan(user_id)
            merged_items = _merge_plan_items(existing_row["plan"], new_items) if existing_row else new_items
            op_result = (
                supabase.table("career_plans")
                .update({"analysis_id": analysis_id, "plan": merged_items})
                .eq("user_id", user_id)
                .execute()
            )
            confirmation_text = " I've added this to your learning plan - check the Learning Plan page."

        if op_result.data:
            reply_text = parsed.reply + confirmation_text
        else:
            reply_text = parsed.reply + " I tried to update your plan but couldn't save it - please try asking again."

    supabase.table("coach_messages").insert(
        {"analysis_id": analysis_id, "user_id": user_id, "role": "user", "content": message}
    ).execute()

    assistant_result = (
        supabase.table("coach_messages")
        .insert(
            {"analysis_id": analysis_id, "user_id": user_id, "role": "assistant", "content": reply_text}
        )
        .execute()
    )
    if not assistant_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the coach's reply. Please try again.",
        )
    return assistant_result.data[0]


def get_history(user_id: str, analysis_id: str) -> list[dict]:
    analysis = _fetch_owned_analysis(analysis_id, user_id)
    _maybe_insert_kickoff_message(analysis, analysis_id, user_id)
    result = (
        supabase.table("coach_messages")
        .select("id, role, content, created_at")
        .eq("analysis_id", analysis_id)
        .eq("user_id", user_id)
        .order("created_at")
        .execute()
    )
    return result.data