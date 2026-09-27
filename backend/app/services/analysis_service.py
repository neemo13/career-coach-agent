"""
WHAT  - fetches a user's resume + job description, runs skill_matching_tool,
        computes a deterministic match score, and persists the analysis.
WHY   - Phase 7 change: this file NO LONGER generates a learning plan at
        creation time (that was Phase 5's behavior). Plan generation is now
        conversational and user-confirmed - see app/agents/career_agent.py
        and app/services/coach_service.py. An analysis is purely an
        objective assessment of one job opportunity; it never touches the
        learning plan.
HOW   - app/api/analysis.py calls run_analysis(user_id, resume_id, job_id, name).
"""

from fastapi import HTTPException, status

from app.core.supabase_client import supabase
from app.tools.skill_matching_tool import run_skill_matching


def _fetch_owned_text(table: str, row_id: str, user_id: str) -> str:
    result = (
        supabase.table(table)
        .select("id, raw_text")
        .eq("id", row_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        label = "Resume" if table == "resumes" else "Job description"
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"{label} not found.")
    return result.data["raw_text"]


def run_analysis(
    user_id: str, resume_id: str, job_description_id: str, name: str | None = None
) -> dict:
    resume_text = _fetch_owned_text("resumes", resume_id, user_id)
    job_text = _fetch_owned_text("job_descriptions", job_description_id, user_id)

    if not resume_text.strip() or not job_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume or job description text is empty.",
        )

    # IMPORTANT: only resume text + job text are sent to the LLM.
    # No user_id, row IDs, email, or credentials are included.
    skill_result = run_skill_matching(resume_text, job_text)

    matching = skill_result.matching_skills
    missing = skill_result.missing_skills
    total = len(matching) + len(missing)
    match_score = round((len(matching) / total) * 100, 1) if total > 0 else 0.0

    analysis_row = {
        "user_id": user_id,
        "resume_id": resume_id,
        "job_description_id": job_description_id,
        "name": name,
        "matching_skills": matching,
        "missing_skills": missing,
        "strengths": skill_result.strengths,
        "weaknesses": skill_result.weaknesses,
        "recommendations": skill_result.recommendations,
        "match_score": match_score,
        "summary": skill_result.summary,
    }

    result = supabase.table("analyses").insert(analysis_row).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the analysis. Please try again.",
        )
    return result.data[0]