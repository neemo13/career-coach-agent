from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.security import get_current_user_id

from app.api import resumes, jobs, analysis, learning_plan, coach

import logging
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Career Coach API")

# Allows the React frontend (running on a different origin/port) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resumes.router, prefix="/resumes", tags=["resumes"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])
app.include_router(learning_plan.router, prefix="/learning-plan", tags=["learning-plan"])
app.include_router(coach.router, prefix="/coach", tags=["coach"])

@app.get("/health")
def health():
    """Plain liveness check - no external dependencies. Should always return ok."""
    return {"status": "ok"}


@app.get("/health/db")
def health_db():
    """
    Verifies the backend can actually reach Supabase using the credentials
    in .env. Queries the `profiles` table created in Phase 2 setup.
    Returns a clear error message instead of a raw stack trace if it fails.
    """
    from app.core.supabase_client import supabase

    try:
        result = supabase.table("profiles").select("id").limit(1).execute()
        return {"status": "ok", "rows_returned": len(result.data)}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@app.get("/me")
def read_current_user(user_id: str = Depends(get_current_user_id)):
    """
    Protected route used as the Phase 2 checkpoint: if this returns your
    user id, the full round trip (frontend login -> JWT -> backend
    verification) is working end to end.
    """
    from app.core.supabase_client import supabase

    result = (
        supabase.table("profiles").select("id, full_name, created_at").eq("id", user_id).single().execute()
    )
    return {"user_id": user_id, "profile": result.data}
