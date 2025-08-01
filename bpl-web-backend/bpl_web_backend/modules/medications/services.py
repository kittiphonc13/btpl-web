"""
Medications module services for business logic.
"""

from fastapi import HTTPException, status, Response
from gotrue.types import User
from postgrest.exceptions import APIError
from typing import List

from ...database import supabase
from .models import Medication, MedicationUpdate, MedicationResponse


class MedicationService:
    """Service class for medication operations."""
    
    @staticmethod
    def get_medications(current_user: User) -> List[MedicationResponse]:
        """Get all medications for the current user."""
        try:
            response = supabase.table("medications").select("*").eq("user_id", current_user.id).execute()
            return [MedicationResponse(**med) for med in response.data]
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def create_medication(medication: Medication, current_user: User) -> MedicationResponse:
        """Create a new medication."""
        try:
            medication_data = medication.model_dump()
            medication_data["user_id"] = str(current_user.id)
            response = supabase.table("medications").insert(medication_data).execute()
            if not response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create medication: No data returned")
            return MedicationResponse(**response.data[0])
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def update_medication(medication_id: int, medication_update: MedicationUpdate, current_user: User) -> MedicationResponse:
        """Update an existing medication."""
        update_data = medication_update.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update")

        try:
            response = supabase.table("medications").update(update_data).eq("id", medication_id).eq("user_id", current_user.id).execute()
            if not response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found")
            return MedicationResponse(**response.data[0])
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def delete_medication(medication_id: int, current_user: User) -> Response:
        """Delete a medication."""
        try:
            response = supabase.table("medications").delete().eq("id", medication_id).eq("user_id", current_user.id).execute()
            
            if not response.data:
                return Response(status_code=status.HTTP_404_NOT_FOUND)
                
            return Response(status_code=status.HTTP_204_NO_CONTENT)

        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=e.message)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
