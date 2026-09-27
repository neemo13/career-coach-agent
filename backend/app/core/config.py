"""
Central place that reads environment variables into a typed object.

Why this exists (for your interview notes):
WHAT  - loads all config/secrets from the environment (via .env in dev) into one object.
WHY   - so no other file in the app calls os.environ directly; config is typed,
        validated once at startup, and easy to mock in tests.
HOW   - other modules do `from app.core.config import settings` and read attributes.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # LLM (used starting Phase 4)
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    groq_api_key: str = ""

    # CORS
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Import this single instance everywhere instead of re-reading env vars.
settings = Settings()
