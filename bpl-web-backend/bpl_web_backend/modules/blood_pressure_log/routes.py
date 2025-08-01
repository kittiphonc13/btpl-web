"""
Blood Pressure Log module routes for API endpoints.
"""

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from gotrue.types import User
from typing import List

from ...dependencies import get_current_user
from .models import BloodPressureRecord, BloodPressureRecordUpdate, BloodPressureRecordResponse
from .services import BloodPressureLogService

router = APIRouter(prefix="/api", tags=["Blood Pressure Logs"])


@router.get("/blood-pressure-logs", response_model=List[BloodPressureRecordResponse])
def get_blood_pressure_logs(current_user: User = Depends(get_current_user), page: int = 1, per_page: int = 25):
    """Get blood pressure logs for the current user with pagination."""
    return BloodPressureLogService.get_blood_pressure_logs(current_user, page, per_page)


@router.post("/blood-pressure-logs", response_model=BloodPressureRecordResponse, status_code=status.HTTP_201_CREATED)
def create_blood_pressure_log(record: BloodPressureRecord, current_user: User = Depends(get_current_user)):
    """Create a new blood pressure log."""
    return BloodPressureLogService.create_blood_pressure_log(record, current_user)


@router.put("/blood-pressure-logs/{log_id}", response_model=BloodPressureRecordResponse)
def update_blood_pressure_log(log_id: int, record: BloodPressureRecordUpdate, current_user: User = Depends(get_current_user)):
    """Update an existing blood pressure log."""
    return BloodPressureLogService.update_blood_pressure_log(log_id, record, current_user)


@router.delete("/blood-pressure-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blood_pressure_log(log_id: int, current_user: User = Depends(get_current_user)):
    """Delete a blood pressure log."""
    return BloodPressureLogService.delete_blood_pressure_log(log_id, current_user)


@router.get("/blood-pressure-logs/export")
def export_blood_pressure_logs(current_user: User = Depends(get_current_user)):
    """Export blood pressure logs to Excel file."""
    return BloodPressureLogService.export_blood_pressure_logs(current_user)
