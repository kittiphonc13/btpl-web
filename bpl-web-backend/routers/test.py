from fastapi import APIRouter, HTTPException
from models import UserProfile
from database import supabase

router = APIRouter()

@router.post("/profiles/test-create", tags=["Test"]) # Temporary test endpoint
def create_test_user_profile(profile: UserProfile):
    test_user_id = "a1b2c3d4-e5f6-7890-1234-567890abcdef" # Example UUID
    profile_data = profile.model_dump(exclude_unset=True)
    profile_data["user_id"] = test_user_id

    try:
        # Check if profile already exists for the test user
        existing_profile = supabase.table("user_profiles").select("user_id").eq("user_id", test_user_id).execute()
        if existing_profile.data:
            # If it exists, update it instead of creating a new one for test purposes
            updated_profile = supabase.table("user_profiles").update(profile.model_dump(exclude_unset=True)).eq("user_id", test_user_id).execute()
            if not updated_profile.data:
                raise HTTPException(status_code=500, detail="Failed to update test profile")
            return updated_profile.data[0]
        else:
            # Create a new profile
            new_profile = supabase.table("user_profiles").insert(profile_data).execute()
            if not new_profile.data:
                raise HTTPException(status_code=500, detail="Failed to create test profile")
            return new_profile.data[0]
    except Exception as e:
        # Catch any database-related exceptions and return a generic 500 error
        # In a real app, you might want to log the error `e` as well
        raise HTTPException(status_code=500, detail="An unexpected database error occurred.")
