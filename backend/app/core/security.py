"""
WHAT  - FastAPI dependency that verifies a Supabase Auth access token.
WHY   - The frontend authenticates with Supabase and sends the access token
        to protected FastAPI endpoints.
HOW   - Supabase's get_claims() verifies the JWT using the project's current
        JWT signing-key configuration (JWKS when using asymmetric keys).
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.supabase_client import supabase

bearer_scheme = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    token = credentials.credentials

    try:
        response = supabase.auth.get_claims(token)

        if not response or not response.get("claims"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session. Please log in again.",
            )

        claims = response["claims"]
        user_id = claims.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session token.",
            )

        return user_id

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
        )