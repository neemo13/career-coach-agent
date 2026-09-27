from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.core.supabase_client import supabase
from app.schemas.job import JobCreate, JobOut

router = APIRouter()


@router.post("", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("job_descriptions")
        .insert(
            {
                "user_id": user_id,
                "title": job.title,
                "raw_text": job.raw_text,
            }
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the job description. Please try again.",
        )

    return result.data[0]


@router.get("", response_model=list[JobOut])
def list_jobs(user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("job_descriptions")
        .select("id, title, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data