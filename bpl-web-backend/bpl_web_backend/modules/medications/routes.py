"""
Medications module routes for API endpoints.
"""

from fastapi import APIRouter, Depends, status, Response
from gotrue.types import User
from typing import List

from ...dependencies import get_current_user
from .models import Medication, MedicationUpdate, MedicationResponse
from .services import MedicationService

router = APIRouter(prefix="/api", tags=["Medications"])


@router.get("/medications", response_model=List[MedicationResponse])
def get_medications(current_user: User = Depends(get_current_user)):
    """Get all medications for the current user."""
    return MedicationService.get_medications(current_user)


@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(medication: Medication, current_user: User = Depends(get_current_user)):
    """Create a new medication."""
    return MedicationService.create_medication(medication, current_user)


@router.put("/medications/{medication_id}", response_model=MedicationResponse)
def update_medication(medication_id: int, medication_update: MedicationUpdate, current_user: User = Depends(get_current_user)):
    """Update an existing medication."""
    return MedicationService.update_medication(medication_id, medication_update, current_user)


@router.delete("/medications/{medication_id}")
def delete_medication(medication_id: int, current_user: User = Depends(get_current_user)):
    """Delete a medication."""
    return MedicationService.delete_medication(medication_id, current_user)
