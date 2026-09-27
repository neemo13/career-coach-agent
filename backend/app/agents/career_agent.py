"""
WHAT  - the agent's decision logic for whether a learning plan should be
        generated during a coach conversation. This decision used to run
        automatically at analysis-creation time (Phase 5); it now runs
        conversationally (Phase 7), because plan generation is a
        personalized, human-in-the-loop decision - not something that
        should happen the instant an analysis is created.
WHY   - keeps the "should the plan be generated now?" decision in one
        place, separate from the LLM call that produces conversational
        replies (services/coach_service.py) and the tool itself
        (tools/learning_plan_tool.py).
HOW   - coach_service.py calls decide_next_step() after every coach reply
        and acts on the returned action itself.

SAFETY: the LLM's own judgment (wants_learning_plan_signal) is treated only
as a CANDIDATE signal, never as sufficient cause to generate a plan. Two
separate conditions must both hold before generation happens:
  1. The PREVIOUS assistant message was this exact confirmation prompt - a
     sentinel string we control (not LLM-generated), so we know for certain
     the user was actually asked and is now responding to that question.
  2. The user's CURRENT message is an unambiguous affirmative reply,
     checked deterministically below - no LLM judgment call at all.
This means a vague question like "what would you recommend I learn first?"
can only ever (at most) prompt the confirmation question - it can never
itself trigger generation, which only ever happens on a clear "yes" the
turn immediately after that specific question was asked.
"""

import logging

logger = logging.getLogger("career_agent")

CONFIRMATION_PROMPT = (
    "Just to confirm - would you like me to generate your personalized "
    "learning plan now based on what we've discussed?"
)

_AFFIRMATIVE_PHRASES = {
    "yes", "yes please", "yeah", "yep", "sure", "confirm", "confirmed",
    "go ahead", "please do", "do it", "generate it", "generate the plan",
    "yes create the plan", "yes, create the plan", "please generate the plan",
    "create it", "create the plan",
}

UPDATE_CONFIRMATION_PROMPT = (
    "Just to confirm - would you like me to add this to your learning plan now?"
)

def decide_next_step(
    *,
    wants_learning_plan_signal: bool,
    previous_assistant_message: str | None,
    user_message: str,
    missing_skills: list[str],
    plan_already_exists: bool,
) -> str:
    """Returns "none" | "ask_confirmation" | "ask_update_confirmation" | "generate_plan" | "update_plan"."""
    if not missing_skills:
        return "none"

    already_asked_generate = previous_assistant_message == CONFIRMATION_PROMPT
    already_asked_update = previous_assistant_message == UPDATE_CONFIRMATION_PROMPT

    if already_asked_generate and _is_unambiguous_confirmation(user_message):
        logger.info("career_agent: user confirmed -> DECISION: generate_plan")
        return "generate_plan"

    if already_asked_update and _is_unambiguous_confirmation(user_message):
        logger.info("career_agent: user confirmed update -> DECISION: update_plan")
        return "update_plan"

    if wants_learning_plan_signal and not already_asked_generate and not already_asked_update:
        if plan_already_exists:
            logger.info("career_agent: candidate update intent -> DECISION: ask_update_confirmation")
            return "ask_update_confirmation"
        logger.info("career_agent: candidate intent -> DECISION: ask_confirmation")
        return "ask_confirmation"

    return "none"

def _is_unambiguous_confirmation(user_message: str) -> bool:
    normalized = user_message.strip().lower().rstrip(".!")
    if normalized in _AFFIRMATIVE_PHRASES:
        return True
    return normalized.startswith(("yes", "yeah", "yep")) and "plan" in normalized


