"""
WHAT  - creates one Supabase client the backend uses to talk to Postgres/Auth.
WHY   - the backend uses the powerful `service_role` key (bypasses Row Level
        Security) because it needs to act on behalf of any verified user;
        this key must NEVER be sent to the frontend.
HOW   - other files do `from app.core.supabase_client import supabase`.
"""

from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_role_key,
)
