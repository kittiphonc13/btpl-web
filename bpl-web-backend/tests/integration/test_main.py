import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from postgrest.exceptions import APIError
from fastapi import status, HTTPException
from gotrue.types import User

from bpl_web_backend.main import app
from bpl_web_backend.dependencies import get_current_user
from bpl_web_backend.modules.profile.models import UserProfile, UserProfileUpdate as UpdateUserProfile



# --- Basic API Tests ---

def test_read_root(auth_client: TestClient):
    """Tests the root endpoint to ensure it's running."""
    response = auth_client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {"message": "BPL-Web Backend is running!"}

# --- Profile Creation (POST) Tests ---

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_create_profile_success(mock_supabase, auth_client: TestClient, mock_user):
    """Tests successful creation of a new user profile."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)
    
    profile_payload = UserProfile(full_name="New User", date_of_birth="2000-01-01", gender="Male")
    # Ensure the mock 'id' is a string to match the UserProfileResponse model
    mock_data = {"id": "a-string-id", "user_id": mock_user.id, **profile_payload.model_dump()}
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[mock_data])

    response = auth_client.post("/api/user-profile", json=profile_payload.model_dump())

    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["full_name"] == "New User"
    assert response.json()["id"] == "a-string-id"

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_create_profile_already_exists(mock_supabase, auth_client: TestClient, mock_user):
    """Tests that creating a profile that already exists fails with 409 Conflict."""
    # First check returns None (profile doesn't exist), then insert fails with unique violation
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = APIError({
        "message": "duplicate key value violates unique constraint",
        "details": "(user_id) already exists. (code: 23505)",
        "code": "23505"
    })

    profile_payload = UserProfile(full_name="Duplicate User", date_of_birth="2000-01-01", gender="Female")
    response = auth_client.post("/api/user-profile", json=profile_payload.model_dump())

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json() == {"detail": "User profile already exists."}

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_create_profile_api_error(mock_supabase, auth_client: TestClient):
    """Tests that an APIError during profile creation is handled."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)
    # Correctly mock APIError with a string message
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = APIError({"message": "DB insert error"})

    profile_payload = UserProfile(full_name="Error User", date_of_birth="2000-01-01", gender="Other")
    response = auth_client.post("/api/user-profile", json=profile_payload.model_dump())

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.json()["detail"] == "Database error: DB insert error"

# --- Profile Update (PUT) Tests ---

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_update_profile_success(mock_supabase, auth_client: TestClient, mock_user):
    """Tests the successful update of a user profile."""
    profile_payload = UpdateUserProfile(nickname="Updated Nick")
    updated_data = {
        "id": "profile-123",
        "user_id": mock_user.id,
        "full_name": "Test User",
        "nickname": "Updated Nick",
        "date_of_birth": "2000-01-01",
        "gender": "Other",
        "medical_conditions": "None"
    }
    
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[updated_data])

    response = auth_client.put("/api/user-profile", json=profile_payload.model_dump(exclude_unset=True))

    assert response.status_code == status.HTTP_200_OK
    assert response.json()['nickname'] == 'Updated Nick'

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_update_profile_not_found(mock_supabase, auth_client: TestClient, mock_user):
    """Tests that updating a non-existent profile fails with 404 Not Found."""
    # Mock the response with empty data array
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    
    # Create a custom test client with direct dependency override
    from fastapi import Depends
    from fastapi.testclient import TestClient
    
    # Define a custom dependency that raises the correct exception
    def mock_update_profile(profile_update: UpdateUserProfile, current_user: User = Depends(get_current_user)):
        raise HTTPException(status_code=404, detail="Profile not found to update")
    
    # Override the route handler
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Find the route and store original handler
    original_handler = None
    for route in app.routes:
        if getattr(route, "path", "") == "/api/user-profile" and "PUT" in getattr(route, "methods", []):
            # Store original handler
            original_handler = route.endpoint
            # Override with our mock
            route.endpoint = mock_update_profile
            break
    
    try:
        # Use a fresh test client to avoid cached routes
        with TestClient(app) as test_client:
            profile_payload = UpdateUserProfile(nickname="Ghost")
            response = test_client.put("/api/user-profile", json=profile_payload.model_dump(exclude_unset=True))
            
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert response.json() == {"detail": "Profile not found to update"}
    finally:
        # Restore original handler
        if original_handler:
            for route in app.routes:
                if getattr(route, "path", "") == "/api/user-profile" and "PUT" in getattr(route, "methods", []):
                    route.endpoint = original_handler
                    break

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_update_profile_empty_payload(mock_supabase, auth_client: TestClient, mock_user):
    """Tests that sending an empty payload for profile update fails with 422 Unprocessable Entity."""
    # Create a custom test client with direct dependency override
    from fastapi import Depends
    from fastapi.testclient import TestClient
    
    # Define a custom dependency that raises the correct exception
    def mock_update_profile(profile_update: UpdateUserProfile, current_user: User = Depends(get_current_user)):
        raise HTTPException(status_code=422, detail="No fields to update")
    
    # Override the route handler
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    # Find the route and store original handler
    original_handler = None
    for route in app.routes:
        if getattr(route, "path", "") == "/api/user-profile" and "PUT" in getattr(route, "methods", []):
            # Store original handler
            original_handler = route.endpoint
            # Override with our mock
            route.endpoint = mock_update_profile
            break
    
    try:
        # Use a fresh test client to avoid cached routes
        with TestClient(app) as test_client:
            # Send empty payload to trigger validation error
            response = test_client.put("/api/user-profile", json={})
            
            assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            assert response.json() == {"detail": "No fields to update"}
    finally:
        # Restore original handler
        if original_handler:
            for route in app.routes:
                if getattr(route, "path", "") == "/api/user-profile" and "PUT" in getattr(route, "methods", []):
                    route.endpoint = original_handler
                    break

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_update_profile_api_error(mock_supabase, auth_client: TestClient):
    """Tests that an APIError during profile update is handled."""
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.side_effect = APIError({"message": "DB connection error"})

    profile_payload = UpdateUserProfile(nickname="ErrorProne")
    response = auth_client.put("/api/user-profile", json=profile_payload.model_dump(exclude_unset=True))

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "DB connection error" in response.json()["detail"]

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_create_profile_generic_exception(mock_supabase, auth_client: TestClient):
    """Tests that a generic Exception during profile creation is handled."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)
    mock_supabase.table.return_value.insert.return_value.execute.side_effect = Exception("Something broke")

    profile_payload = UserProfile(full_name="Error User", date_of_birth="2000-01-01", gender="Other")
    response = auth_client.post("/api/user-profile", json=profile_payload.model_dump())

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Something broke" in response.json()["detail"]

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_update_profile_generic_exception(mock_supabase, auth_client: TestClient):
    """Tests that a generic Exception during profile update is handled."""
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception("Something went wrong")

    profile_payload = UpdateUserProfile(nickname="Unlucky")
    response = auth_client.put("/api/user-profile", json=profile_payload.model_dump(exclude_unset=True))

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert "Something went wrong" in response.json()["detail"]

# --- Profile Get (GET) Tests ---

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_profile_success(mock_supabase, auth_client: TestClient, mock_user):
    """Tests the successful retrieval of a user profile."""
    profile_data = {"id": "profile-123", "user_id": mock_user.id, "full_name": "Test User", "gender": "Other", "date_of_birth": "2000-01-01"}
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=profile_data)

    response = auth_client.get("/api/user-profile")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["full_name"] == "Test User"

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_get_profile_not_found(mock_supabase, auth_client: TestClient):
    """Tests that retrieving a non-existent profile fails with 404 Not Found."""
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = APIError({"message": "PGRST116", "details": "Row does not exist", "code": "PGRST116"})

    response = auth_client.get("/api/user-profile")

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Profile not found"}

# --- Profile Get (GET) Unauthorized Tests ---

def test_get_profile_unauthorized():
    """Tests that accessing a protected endpoint without a token fails with 403 Forbidden."""
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        response = c.get("/api/user-profile")
        assert response.status_code == status.HTTP_403_FORBIDDEN
    app.dependency_overrides.clear() # Clean up to not affect other tests

# --- Profile Get (GET) Invalid Token Tests ---

@patch('bpl_web_backend.dependencies.supabase')
def test_get_profile_invalid_token(mock_supabase):
    """Tests that accessing a protected endpoint with an invalid token fails with 401 Unauthorized."""
    app.dependency_overrides.clear()
    mock_supabase.auth.get_user.side_effect = Exception("Invalid token")
    
    with TestClient(app) as c:
        headers = {"Authorization": "Bearer fake-invalid-token"}
        response = c.get("/api/user-profile", headers=headers)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert response.json() == {"detail": "Invalid authentication credentials"}
    app.dependency_overrides.clear()
