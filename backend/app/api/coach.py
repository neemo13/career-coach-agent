from fastapi import APIRouter, Depends, status

from app.core.security import get_current_user_id
from app.schemas.coach import ChatRequest, ChatMessageOut
from app.services.coach_service import send_message, get_history

router = APIRouter()


@router.post("/chat", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def chat(payload: ChatRequest, user_id: str = Depends(get_current_user_id)):
    print(">>> /coach/chat ROUTE HIT <<<", flush=True)
    return send_message(user_id, payload.analysis_id, payload.message)


@router.get("/{analysis_id}/messages", response_model=list[ChatMessageOut])
def messages(analysis_id: str, user_id: str = Depends(get_current_user_id)):
    return get_history(user_id, analysis_id)