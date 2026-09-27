"""
WHAT  - Tool 2: turns a list of missing skills into a prioritized, ordered
        learning plan, optionally weighted by the user's stated priorities
        from a coach conversation.
WHY   - has NO opinion on WHETHER it should run - that decision belongs to
        app/agents/career_agent.py. This tool only knows how to turn
        (skills, job context, optional preferences) into a plan.
HOW   - called by app/services/coach_service.py.
"""

from app.core.llm_provider import get_llm_provider, generate_with_raw_schema_and_retry, _learning_plan_gemini_schema
from app.schemas.learning_plan import LearningPlanResult

LEARNING_PLAN_PROMPT_TEMPLATE = """A candidate is missing the following skills for a job they want:

MISSING SKILLS:
{missing_skills}

JOB CONTEXT:
{job_text}

CONVERSATION CONTEXT (the user's stated priorities, if any - respect these when reasonable,
e.g. deprioritizing or omitting a skill the user explicitly said they don't want to focus on
right now. Do not invent preferences that were not actually stated.):
{conversation_context}

For each skill you include, produce a prioritized learning plan item with:
- skill: the skill name
- priority: "high", "medium", or "low"
- recommended_area: a short phrase on what/how to learn
- difficulty: "beginner", "intermediate", or "advanced"
- order: an integer learning order starting at 1
- term: "short_term" if this is learnable within a few weeks and high-leverage soon,
  "long_term" if it needs sustained practice over a longer period
- resources: 1-3 GENERAL resource types to start with (e.g. "official documentation",
  "a small hands-on project", "a structured online course", "interview-prep practice
  problems") - always include at least one, do NOT invent specific URLs, course names,
  or book titles since these can't be verified as real or current.

Base the set of skills on the missing skills list, adjusted for the user's stated
priorities from the conversation context where reasonable.
"""


def run_learning_plan(
    missing_skills: list[str], job_text: str, conversation_context: str = ""
) -> LearningPlanResult:
    provider = get_llm_provider()
    prompt = LEARNING_PLAN_PROMPT_TEMPLATE.format(
        missing_skills=", ".join(missing_skills),
        job_text=job_text,
        conversation_context=conversation_context or "(none)",
    )
    return generate_with_raw_schema_and_retry(provider, prompt, _learning_plan_gemini_schema(), LearningPlanResult)