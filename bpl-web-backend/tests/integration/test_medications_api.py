import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from fastapi import status
from postgrest.exceptions import APIError

from bpl_web_backend.main import app
from bpl_web_backend.dependencies import get_current_user


@pytest.fixture
def mock_user():
    """Fixture for a mock user object."""
    user = MagicMock()
    user.id = "user-123"
    return user


@pytest.fixture
def client(mock_user):
    """Fixture for a TestClient with an overridden user dependency."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# --- Test Cases for GET /medications ---

@patch('bpl_web_backend.modules.medications.services.supabase')
def test_get_medications_success(mock_supabase, client, mock_user):
    """Test successful retrieval of medications."""
    mock_data = [
        {
            "id": 1, "user_id": mock_user.id, "medicine_name": "Lisinopril",
            "dosage_mg": 10, "quantity": "30", "intake_time": ["Morning"],
            "is_active": True, "notes": None
        },
        {
            "id": 2, "user_id": mock_user.id, "medicine_name": "Aspirin",
            "dosage_mg": 81, "quantity": "90", "intake_time": ["Morning"],
            "is_active": True, "notes": None
        }
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=mock_data)

    response = client.get("/api/medications")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2
    assert response.json()[0]["medicine_name"] == "Lisinopril"


@patch('bpl_web_backend.modules.medications.services.supabase')
def test_get_medications_api_error(mock_supabase, client):
    """Test API error during medication retrieval."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.execute.side_effect = APIError({"message": "DB Error"})

    response = client.get("/api/medications")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {"detail": "DB Error"}


# --- Test Cases for POST /medications ---

@patch('bpl_web_backend.modules.medications.services.supabase')
def test_create_medication_success(mock_supabase, client, mock_user):
    """Test successful creation of a new medication."""
    payload = {
        "medicine_name": "Ibuprofen", "dosage_mg": 200, "quantity": "50",
        "intake_time": ["Anytime"], "is_active": True, "notes": "For headache"
    }
    mock_data = {"id": 3, "user_id": mock_user.id, **payload}
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[mock_data])

    response = client.post("/api/medications", json=payload)

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["medicine_name"] == "Ibuprofen"


@patch('bpl_web_backend.modules.medications.services.supabase')
def test_create_medication_no_data_returned(mock_supabase, client):
    """Test server error if Supabase returns no data on creation."""
    payload = {"medicine_name": "Test Med", "quantity": "30", "intake_time": ["Morning"]}
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[])

    response = client.post("/api/medications", json=payload)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {"detail": "Failed to create medication: No data returned"}


# --- Test Cases for PUT /medications/{medication_id} ---

@patch('bpl_web_backend.modules.medications.services.supabase')
def test_update_medication_success(mock_supabase, client, mock_user):
    """Test successful update of an existing medication."""
    med_id = 1
    update_payload = {"notes": "Updated notes"}
    mock_response_data = {
        "id": med_id,
        "user_id": mock_user.id,
        "medicine_name": "Aspirin",
        "dosage_mg": 100,
        "quantity": "100",
        "intake_time": ["Morning"],
        "is_active": True,
        "notes": "Updated notes"
    }
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[mock_response_data])

    response = client.put(f"/api/medications/{med_id}", json=update_payload)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["notes"] == "Updated notes"


@patch('bpl_web_backend.modules.medications.services.supabase')
def test_update_medication_not_found(mock_supabase, client):
    """Test updating a medication that does not exist."""
    med_id = 999
    payload = {"notes": "This should not exist"}
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    response = client.put(f"/api/medications/{med_id}", json=payload)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Medication not found"}


def test_update_medication_empty_payload(client):
    """Test updating a medication with an empty payload."""
    response = client.put("/api/medications/1", json={})

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert response.json() == {"detail": "No fields to update"}


# --- Test Cases for DELETE /medications/{medication_id} ---

@patch('bpl_web_backend.modules.medications.services.supabase')
def test_delete_medication_success(mock_supabase, client, mock_user):
    """Test successful deletion of a medication."""
    med_id = 1
    mock_data = [{"id": med_id, "user_id": mock_user.id, "medication_name": "test"}]
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=mock_data)

    response = client.delete(f"/api/medications/{med_id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT


@patch('bpl_web_backend.modules.medications.services.supabase')
def test_delete_medication_not_found(mock_supabase, client):
    """Test deleting a medication that does not exist."""
    med_id = 999
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])

    response = client.delete(f"/api/medications/{med_id}")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@patch('bpl_web_backend.modules.medications.services.supabase')
def test_delete_medication_api_error(mock_supabase, client):
    """Test API error during medication deletion."""
    med_id = 1
    mock_supabase.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.side_effect = APIError({"message": "Deletion failed"})

    response = client.delete(f"/api/medications/{med_id}")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json()["detail"] == "Deletion failed"
