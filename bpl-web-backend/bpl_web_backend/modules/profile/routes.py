"""
Profile module routes for API endpoints.
"""

from fastapi import APIRouter, Depends
from gotrue.types import User

from ...dependencies import get_current_user
from .models import UserProfile, UserProfileUpdate, UserProfileResponse
from .services import ProfileService

router = APIRouter(prefix="/api", tags=["Profile"])


@router.get("/user-profile", response_model=UserProfileResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return ProfileService.get_user_profile(current_user)


@router.post("/user-profile", response_model=UserProfileResponse, status_code=201)
def create_user_profile(profile: UserProfile, current_user: User = Depends(get_current_user)):
    """Create a new user profile."""
    return ProfileService.create_user_profile(profile, current_user)


@router.put("/user-profile", response_model=UserProfileResponse)
def update_user_profile(profile_update: UserProfileUpdate, current_user: User = Depends(get_current_user)):
    """Update current user's profile."""
    return ProfileService.update_user_profile(profile_update, current_user)
