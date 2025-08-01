"""
Blood Pressure Log module services for business logic.
"""

from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse
from gotrue.types import User
from postgrest.exceptions import APIError
from typing import List
import pandas as pd
import io

from ...database import supabase
from .models import BloodPressureRecord, BloodPressureRecordUpdate, BloodPressureRecordResponse


class BloodPressureLogService:
    """Service class for blood pressure log operations."""
    
    @staticmethod
    def get_blood_pressure_logs(current_user: User, page: int = 1, per_page: int = 25) -> List[BloodPressureRecordResponse]:
        """Get blood pressure logs for the current user with pagination."""
        try:
            offset = (page - 1) * per_page
            response = supabase.table("blood_pressure_records").select("*", count='exact').eq("user_id", current_user.id).order("record_datetime", desc=True).range(offset, offset + per_page - 1).execute()
            return [BloodPressureRecordResponse(**record) for record in response.data]
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e.message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def create_blood_pressure_log(record: BloodPressureRecord, current_user: User) -> BloodPressureRecordResponse:
        """Create a new blood pressure log."""
        try:
            record_data = record.model_dump()
            record_data['user_id'] = str(current_user.id)
            response = supabase.table("blood_pressure_records").insert(record_data).execute()
            if not response.data:
                raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create log: No data returned")
            return BloodPressureRecordResponse(**response.data[0])
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e.message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def update_blood_pressure_log(log_id: int, record: BloodPressureRecordUpdate, current_user: User) -> BloodPressureRecordResponse:
        """Update an existing blood pressure log."""
        try:
            update_data = record.model_dump(exclude_unset=True)
            if not update_data:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="No fields to update")

            response = supabase.table("blood_pressure_records").update(update_data).eq("id", log_id).eq("user_id", current_user.id).execute()
            
            if not response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found or no changes made")
                
            return BloodPressureRecordResponse(**response.data[0])
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e.message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def delete_blood_pressure_log(log_id: int, current_user: User) -> None:
        """Delete a blood pressure log."""
        try:
            response = supabase.table("blood_pressure_records").delete().eq("id", log_id).eq("user_id", current_user.id).execute()
            
            if not response.data:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
                
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e.message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
    
    @staticmethod
    def export_blood_pressure_logs(current_user: User) -> StreamingResponse:
        """Export blood pressure logs to Excel file."""
        try:
            response = supabase.table("blood_pressure_records").select("*").eq("user_id", current_user.id).order("record_datetime", desc=True).execute()
            if not response.data:
                # Return an empty Excel file if there's no data
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                    pd.DataFrame().to_excel(writer, index=False, sheet_name='Blood Pressure Logs')
                output.seek(0)
                return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=blood_pressure_logs.xlsx"})
            
            df = pd.DataFrame(response.data)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                df.to_excel(writer, index=False, sheet_name='Blood Pressure Logs')
            
            output.seek(0)
            return StreamingResponse(output, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=blood_pressure_logs.xlsx"})
        except APIError as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {e.message}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")
