from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_id
from app.core.supabase_client import supabase
from app.schemas.learning_plan import LearningPlanOut, LearningPlanUpdate

router = APIRouter()


@router.get("", response_model=LearningPlanOut)
def get_learning_plan(user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("career_plans")
        .select("id, analysis_id, plan, created_at")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a learning plan yet - discuss your goals with the Career Coach to build one.",
        )
    return result.data


@router.patch("", response_model=LearningPlanOut)
def update_learning_plan(payload: LearningPlanUpdate, user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("career_plans")
        .update({"plan": [item.model_dump() for item in payload.plan]})
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No learning plan found.")
    return result.data[0]