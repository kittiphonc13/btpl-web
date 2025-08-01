from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from postgrest.exceptions import APIError
from datetime import datetime, timezone
from fastapi import status

# All fixtures (client, auth_client, mock_user) are now in conftest.py

# Create mock modules for pandas and xlsxwriter
class MockPandas:
    def __init__(self):
        self.DataFrame = MagicMock()
        self.ExcelWriter = MagicMock()

class MockXlsxwriter:
    def __init__(self):
        pass

# Create mock instances
mock_pandas = MockPandas()
mock_xlsxwriter = MockXlsxwriter()

# --- Test Cases ---

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_create_bp_record_success(mock_supabase, auth_client: TestClient, mock_user: MagicMock):
    """Tests successful creation of a blood pressure record."""
    record_time = datetime.now(timezone.utc).isoformat()
    bp_payload = {
        "record_datetime": record_time,
        "systolic": 120,
        "diastolic": 80,
        "heart_rate": 70,
        "notes": "Feeling good"
    }
    mock_db_response = {**bp_payload, "id": 1, "user_id": mock_user.id}
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[mock_db_response])

    response = auth_client.post("/api/blood-pressure-logs", json=bp_payload)
    
    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert response_data["systolic"] == 120

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_get_bp_logs_success(mock_supabase, auth_client: TestClient, mock_user: MagicMock):
    """Tests successful retrieval of blood pressure logs."""
    time_now = datetime.now(timezone.utc).isoformat()
    mock_logs = [
        {"id": 1, "user_id": mock_user.id, "systolic": 120, "diastolic": 80, "heart_rate": 70, "notes": "Test 1", "record_datetime": time_now},
        {"id": 2, "user_id": mock_user.id, "systolic": 125, "diastolic": 85, "heart_rate": 75, "notes": "Test 2", "record_datetime": time_now}
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(data=mock_logs)

    response = auth_client.get("/api/blood-pressure-logs")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2
    assert response.json()[0]['systolic'] == 120

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_get_bp_logs_empty(mock_supabase, auth_client: TestClient):
    """Tests getting an empty list when no logs exist."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = MagicMock(data=[])
    
    response = auth_client.get("/api/blood-pressure-logs")
    
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_bp_record_validation_error(auth_client: TestClient):
    """Tests for validation error when creating a record with missing fields."""
    bp_payload = {"systolic": 120, "diastolic": 80} # Missing record_datetime
    response = auth_client.post("/api/blood-pressure-logs", json=bp_payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_update_bp_record_success(mock_supabase, auth_client: TestClient, mock_user: MagicMock):
    """Tests successful update of a blood pressure record."""
    log_id = 1
    payload = {"notes": "Feeling good"}
    record_time = datetime.now(timezone.utc).isoformat()
    mock_data = {"id": log_id, "user_id": mock_user.id, "systolic": 120, "diastolic": 80, "heart_rate": 70, "record_datetime": record_time, **payload}
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[mock_data])

    response = auth_client.put(f"/api/blood-pressure-logs/{log_id}", json=payload)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["notes"] == "Feeling good"

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_update_bp_record_not_found(mock_supabase, auth_client: TestClient):
    """Tests updating a non-existent record returns 404."""
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    response = auth_client.put("/api/blood-pressure-logs/999", json={"systolic": 130})
    
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Log not found or no changes made"}

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_update_bp_record_empty_payload(mock_supabase, auth_client: TestClient):
    """Tests that an update with an empty payload returns 422."""
    response = auth_client.put("/api/blood-pressure-logs/1", json={})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {"detail": "No fields to update"}

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_delete_bp_record_success(mock_supabase, auth_client: TestClient):
    """Tests successful deletion of a blood pressure record."""
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[{"id": 1}])

    response = auth_client.delete("/api/blood-pressure-logs/1")
    
    assert response.status_code == status.HTTP_204_NO_CONTENT

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_delete_bp_record_not_found(mock_supabase, auth_client: TestClient, mock_user: MagicMock):
    """Tests deleting a non-existent record fails with 404."""
    log_id = 999
    # Simulate that the record to be deleted was not found
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    response = auth_client.delete(f"/api/blood-pressure-logs/{log_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Log not found"}

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_export_bp_logs_success(mock_supabase, auth_client: TestClient, mock_user: MagicMock):
    """Tests successful export of blood pressure logs."""
    mock_logs = [
        {"id": 1, "user_id": mock_user.id, "systolic": 120, "diastolic": 80, "heart_rate": 70, "notes": "Test 1", "record_datetime": datetime.now(timezone.utc).isoformat()}
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=mock_logs)

    response = auth_client.get("/api/blood-pressure-logs/export")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers['content-type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert 'attachment; filename=blood_pressure_logs.xlsx' in response.headers['content-disposition']

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_export_bp_logs_empty(mock_supabase, auth_client: TestClient):
    """Tests exporting when no logs exist returns an empty Excel file."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(data=[])

    response = auth_client.get("/api/blood-pressure-logs/export")

    assert response.status_code == status.HTTP_200_OK
    assert response.headers['content-type'] == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    assert 'attachment; filename=blood_pressure_logs.xlsx' in response.headers['content-disposition']

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_api_error_handling(mock_supabase, auth_client: TestClient):
    """Tests that generic APIErrors return 500."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.side_effect = APIError({"message": "DB connection failed"})
    
    response = auth_client.get("/api/blood-pressure-logs")
    
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Database error: DB connection failed" in response.json()["detail"]

@patch('bpl_web_backend.modules.blood_pressure_log.services.supabase')
def test_generic_exception_handling(mock_supabase, auth_client: TestClient):
    """Tests that generic Exceptions return 500."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.side_effect = Exception("Something broke")

    response = auth_client.get("/api/blood-pressure-logs")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "An unexpected error occurred: Something broke" in response.json()["detail"]