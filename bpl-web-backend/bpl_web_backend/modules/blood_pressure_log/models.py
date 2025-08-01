"""
Blood Pressure Log module models for blood pressure record management.
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class BloodPressureRecord(BaseModel):
    """Blood pressure record data model."""
    record_datetime: datetime
    systolic: int
    diastolic: int
    heart_rate: int
    notes: Optional[str] = None


class BloodPressureRecordUpdate(BaseModel):
    """Blood pressure record update model."""
    record_datetime: Optional[datetime] = None
    systolic: Optional[int] = None
    diastolic: Optional[int] = None
    heart_rate: Optional[int] = None
    notes: Optional[str] = None


class BloodPressureRecordResponse(BloodPressureRecord):
    """Blood pressure record response model with ID."""
    id: int
