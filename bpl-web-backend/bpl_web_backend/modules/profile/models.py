"""
Profile module models for user profile management.
"""

from pydantic import BaseModel
from typing import Optional


class UserProfile(BaseModel):
    """User profile data model."""
    full_name: str
    nickname: Optional[str] = None
    date_of_birth: str
    medical_conditions: Optional[str] = None
    gender: str


class UserProfileUpdate(BaseModel):
    """User profile update model."""
    full_name: Optional[str] = None
    nickname: Optional[str] = None
    date_of_birth: Optional[str] = None
    medical_conditions: Optional[str] = None
    gender: Optional[str] = None


class UserProfileResponse(UserProfile):
    """User profile response model with ID."""
    id: str
