from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    analysis_id: str
    message: str = Field(min_length=1)


class ChatReply(BaseModel):
    """Schema the LLM's chat response must match."""
    reply: str
    wants_learning_plan: bool


class ChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime