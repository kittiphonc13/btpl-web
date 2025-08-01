"""
Medications module models for medication management.
"""

from pydantic import BaseModel
from typing import Optional, List


class Medication(BaseModel):
    """Medication data model."""
    medicine_name: str
    dosage_mg: Optional[int] = None
    quantity: str
    intake_time: List[str]
    is_active: bool = True
    notes: Optional[str] = None


class MedicationUpdate(BaseModel):
    """Medication update model."""
    medicine_name: Optional[str] = None
    dosage_mg: Optional[int] = None
    quantity: Optional[str] = None
    intake_time: Optional[List[str]] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MedicationResponse(Medication):
    """Medication response model with ID."""
    id: int
