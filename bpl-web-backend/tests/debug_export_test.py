from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
import json

from bpl_web_backend.main import app
from bpl_web_backend.dependencies import get_current_user

# Create a mock user for testing
mock_user = MagicMock()
mock_user.id = "test-user-id"

# Override the dependency
app.dependency_overrides[get_current_user] = lambda: mock_user

# Create a test client
client = TestClient(app)

def test_export_bp_logs_debug():
    """Debug test for export blood pressure logs."""
    # Create mocks
    mock_supabase = MagicMock()
    mock_streaming_response = MagicMock()
    
    # Mock data
    mock_logs = [
        {"id": 1, "user_id": mock_user.id, "systolic": 120, "diastolic": 80, "heart_rate": 70, "notes": "Test 1", "record_datetime": datetime.now(timezone.utc).isoformat()}
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=mock_logs)
    
    # Create a mock response
    mock_response = MagicMock()
    mock_response.status_code = status.HTTP_200_OK
    mock_response.headers = {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename=blood_pressure_logs.xlsx'
    }
    mock_streaming_response.return_value = mock_response
    
    # Apply the patches manually
    import bpl_web_backend.modules.blood_pressure_log.services
    original_supabase = bpl_web_backend.modules.blood_pressure_log.services.supabase
    
    bpl_web_backend.modules.blood_pressure_log.services.supabase = mock_supabase
    
    try:
        response = client.get("/api/blood-pressure-logs/export")
        
        # Print response details for debugging
        print(f"Status code: {response.status_code}")
        if response.status_code != status.HTTP_200_OK:
            try:
                print(f"Error response: {json.dumps(response.json(), indent=2)}")
            except Exception as e:
                print(f"Could not parse response as JSON: {e}")
                print(f"Raw response content: {response.content[:500]}")
        
        assert response.status_code == status.HTTP_200_OK
    finally:
        # Restore the original
        bpl_web_backend.modules.blood_pressure_log.services.supabase = original_supabase

if __name__ == "__main__":
    # Run the test directly
    test_export_bp_logs_debug()
