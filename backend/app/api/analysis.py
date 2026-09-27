from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.core.supabase_client import supabase
from app.schemas.analysis import AnalysisCreate, AnalysisOut, AnalysisUpdate, AnalysisListItem
from app.services.analysis_service import run_analysis

router = APIRouter()


@router.post("", response_model=AnalysisOut, status_code=status.HTTP_201_CREATED)
def create_analysis(payload: AnalysisCreate, user_id: str = Depends(get_current_user_id)):
    return run_analysis(user_id, payload.resume_id, payload.job_description_id, payload.name)


@router.get("", response_model=list[AnalysisListItem])
def list_analyses(user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("analyses")
        .select("id, name, note, match_score, missing_skills, created_at, job_descriptions(title)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    items = []
    for row in result.data:
        job = row.get("job_descriptions") or {}
        items.append(
            {
                "id": row["id"],
                "name": row["name"],
                "job_title": job.get("title"),
                "note": row["note"],
                "match_score": row["match_score"],
                "missing_skills_count": len(row["missing_skills"] or []),
                "created_at": row["created_at"],
            }
        )
    return items


@router.get("/{analysis_id}", response_model=AnalysisOut)
def get_analysis_detail(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("analyses")
        .select("*, resumes(file_name), job_descriptions(title)")
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    row = result.data
    resume = row.pop("resumes", None) or {}
    job = row.pop("job_descriptions", None) or {}
    row["resume_file_name"] = resume.get("file_name")
    row["job_title"] = job.get("title")
    return row


@router.patch("/{analysis_id}", response_model=AnalysisOut)
def update_analysis(
    analysis_id: str, payload: AnalysisUpdate, user_id: str = Depends(get_current_user_id)
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update.")
    result = (
        supabase.table("analyses")
        .update(updates)
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
    return result.data[0]


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_analysis(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("analyses")
        .delete()
        .eq("id", analysis_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")
    return None