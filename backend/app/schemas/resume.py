from datetime import datetime

from pydantic import BaseModel


class ResumeOut(BaseModel):
    id: str
    file_name: str
    created_at: datetime


class ResumeDetailOut(ResumeOut):
    raw_text: str