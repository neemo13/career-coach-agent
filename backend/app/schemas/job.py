from datetime import datetime

from pydantic import BaseModel, Field


class JobCreate(BaseModel):
    title: str | None = None
    raw_text: str = Field(min_length=1)


class JobOut(BaseModel):
    id: str
    title: str | None
    created_at: datetime


class JobDetailOut(JobOut):
    raw_text: str