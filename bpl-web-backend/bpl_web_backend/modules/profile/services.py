"""
Profile module services for business logic.
"""

from fastapi import HTTPException
from gotrue.types import User
from postgrest.exceptions import APIError

from ...database import supabase
from .models import UserProfile, UserProfileUpdate, UserProfileResponse


class ProfileService:
    """Service class for profile operations."""
    
    @staticmethod
    def get_user_profile(current_user: User) -> UserProfileResponse:
        """Get user profile by user ID."""
        try:
            response = supabase.table("user_profiles").select("*", count='exact').eq("user_id", current_user.id).single().execute()
            return UserProfileResponse(**response.data)
        except APIError as e:
            if "PGRST116" in e.message:
                raise HTTPException(status_code=404, detail="Profile not found")
            raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def create_user_profile(profile: UserProfile, current_user: User) -> UserProfileResponse:
        """Create a new user profile."""
        try:
            profile_data = profile.model_dump()
            profile_data['user_id'] = str(current_user.id)
            response = supabase.table('user_profiles').insert(profile_data).execute()
            if not response.data:
                raise HTTPException(status_code=500, detail="Failed to create profile: No data returned")
            return UserProfileResponse(**response.data[0])
        except APIError as e:
            if '23505' in str(e.details):
                raise HTTPException(status_code=409, detail="User profile already exists.")
            raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def update_user_profile(profile_update: UserProfileUpdate, current_user: User) -> UserProfileResponse:
        """Update user profile."""
        try:
            update_data = profile_update.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(status_code=422, detail="No fields to update")

            response = supabase.table('user_profiles').update(update_data).eq('user_id', current_user.id).execute()
            
            if not response.data:
                raise HTTPException(status_code=404, detail="Profile not found to update")
                
            return UserProfileResponse(**response.data[0])
        except APIError as e:
            raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
        except HTTPException:
            # Re-raise HTTPException directly to preserve status code
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
