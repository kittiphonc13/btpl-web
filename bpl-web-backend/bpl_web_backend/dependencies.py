from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .database import supabase

# Define a security scheme
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency function to get the current user from a JWT token.

    This function validates the token provided in the Authorization header
    and returns the corresponding user object from Supabase.

    Raises:
        HTTPException: If the token is invalid or the user is not found.
    """
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if user_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid token or user not found")
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
