from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from app.core.security import get_current_user_id
from app.core.supabase_client import supabase
from app.schemas.resume import ResumeOut
from app.services.pdf_service import extract_text_from_pdf, ResumeExtractionError

router = APIRouter()


@router.post("", response_model=ResumeOut, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    file_bytes = await file.read()

    try:
        text = extract_text_from_pdf(file_bytes)
    except ResumeExtractionError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    result = (
        supabase.table("resumes")
        .insert(
            {
                "user_id": user_id,
                "file_name": file.filename,
                "raw_text": text,
            }
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save the resume. Please try again.",
        )

    return result.data[0]


@router.get("", response_model=list[ResumeOut])
def list_resumes(user_id: str = Depends(get_current_user_id)):
    result = (
        supabase.table("resumes")
        .select("id, file_name, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data