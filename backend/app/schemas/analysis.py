from datetime import datetime

from pydantic import BaseModel


class AnalysisCreate(BaseModel):
    resume_id: str
    job_description_id: str
    name: str | None = None


class AnalysisUpdate(BaseModel):
    name: str | None = None
    note: str | None = None


class AnalysisOut(BaseModel):
    id: str
    resume_id: str
    job_description_id: str
    name: str | None = None
    note: str | None = None
    resume_file_name: str | None = None
    job_title: str | None = None
    matching_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    match_score: float
    summary: str
    created_at: datetime


class AnalysisListItem(BaseModel):
    id: str
    name: str | None = None
    job_title: str | None = None  # fallback label source when name is null
    note: str | None = None
    match_score: float
    missing_skills_count: int
    created_at: datetime


class GeminiAnalysisResult(BaseModel):
    """
    Schema the LLM's structured output must match. Validated before any of
    it is trusted or stored - Gemini never writes directly to the database.
    match_score is deliberately NOT part of this schema: it's computed
    deterministically in Python from matching_skills/missing_skills instead
    of trusting a number the model invents.
    """

    matching_skills: list[str]
    missing_skills: list[str]
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    summary: str