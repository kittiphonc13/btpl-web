from unittest.mock import patch, MagicMock

from fastapi import status

@patch('bpl_web_backend.modules.profile.services.supabase')
def test_sql_injection_attempt_in_profile(mock_supabase, auth_client, mock_user):
    """Tests how the API handles a potential SQL injection string.

    It should be handled gracefully by Pydantic and the DB driver,
    treating the input as a literal string.
    """
    # This string looks like a SQL injection attack
    malicious_name = "Test User' OR 1=1; --"
    profile_data = {
        "full_name": malicious_name,
        "date_of_birth": "2001-01-01",
        "gender": "Other"
    }

    # 1. Mock the initial check to show the profile does not exist
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(data=None)

    # 2. Mock the insert call to succeed with the literal string
    mock_response_data = {
        "id": "new-profile-id", 
        "user_id": mock_user.id, 
        **profile_data
    }
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(data=[mock_response_data])

    # 3. Make the API Call using the authenticated client
    response = auth_client.post("/api/user-profile", json=profile_data)

    # 4. Assertions
    # The request should succeed because the 'malicious' string is just a string,
    # and the database driver should parameterize it.
    assert response.status_code == status.HTTP_201_CREATED
    assert response.json()["full_name"] == malicious_name
