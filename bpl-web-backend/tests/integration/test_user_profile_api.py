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

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_user_profile_success(mock_supabase, client, mock_user):
    """Test successful retrieval of a user profile."""
    mock_data = {
        "id": "profile-123",
        "user_id": mock_user.id,
        "full_name": "Test User",
        "nickname": "Tester",
        "date_of_birth": "2000-01-01",
        "gender": "Other",
        "medical_conditions": "None"
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=mock_data)

    response = client.get("/api/user-profile")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["full_name"] == "Test User"
    assert response.json()["id"] == "profile-123"

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_user_profile_not_found(mock_supabase, client):
    """Test profile not found (PGRST116)."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = APIError({"message": "PGRST116"})

    response = client.get("/api/user-profile")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Profile not found"}

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_user_profile_api_error(mock_supabase, client):
    """Test other API errors during profile retrieval."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = APIError({"message": "Some other error"})

    response = client.get("/api/user-profile")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {"detail": "Database error: Some other error"}

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_user_profile_generic_exception(mock_supabase, client):
    """Test generic exceptions during profile retrieval."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = Exception("Something broke")

    response = client.get("/api/user-profile")

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json() == {"detail": "An unexpected error occurred: Something broke"}
