from datetime import datetime

from pydantic import BaseModel


class GeneratedLearningPlanItem(BaseModel):
    """What the LLM produces. NO field here may have a default value -
    Gemini's structured-output schema conversion rejects Pydantic
    Field(default=...)/default= constructs entirely (confirmed bug:
    googleapis/python-genai#699), so every field must be required and the
    prompt must explicitly ask for it. completed/user_notes are deliberately
    NOT here - those are user-owned fields, added by our own code after
    generation, never set by the model."""
    skill: str
    priority: str          # "high" | "medium" | "low"
    recommended_area: str
    difficulty: str        # "beginner" | "intermediate" | "advanced"
    order: int
    term: str              # "short_term" | "long_term"
    resources: list[str]   # may be an empty list, but the key itself is required


class LearningPlanResult(BaseModel):
    """Schema the LLM's structured output must match."""
    items: list[GeneratedLearningPlanItem]


class LearningPlanItem(GeneratedLearningPlanItem):
    """What's actually stored/returned - adds the two user-controlled
    fields. Defaults are fine here since this class is NEVER passed as an
    LLM response_schema - only GeneratedLearningPlanItem is."""
    completed: bool = False
    user_notes: str = ""


class LearningPlanOut(BaseModel):
    id: str
    analysis_id: str | None = None
    plan: list[LearningPlanItem]
    created_at: datetime


class LearningPlanUpdate(BaseModel):
    plan: list[LearningPlanItem]