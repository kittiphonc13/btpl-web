import pytest
from pydantic import ValidationError
from bpl_web_backend.modules.profile.models import UserProfile

def test_user_profile_creation_success():
    """Tests successful creation of a UserProfile instance with valid data."""
    profile_data = {
        "full_name": "John Doe",
        "nickname": "Johnny",
        "date_of_birth": "1990-01-15",
        "medical_conditions": "None",
        "gender": "Male"
    }
    profile = UserProfile(**profile_data)
    assert profile.full_name == profile_data["full_name"]
    assert profile.nickname == profile_data["nickname"]
    assert profile.gender == profile_data["gender"]

def test_user_profile_missing_required_field_full_name():
    """Tests that creating a UserProfile without 'full_name' raises a ValidationError."""
    profile_data = {
        "date_of_birth": "1990-01-15"
    }
    with pytest.raises(ValidationError) as exc_info:
        UserProfile(**profile_data)
    # Check that 'full_name' is mentioned in the error details
    assert "full_name" in str(exc_info.value)

def test_user_profile_missing_required_field_dob():
    """Tests that creating a UserProfile without 'date_of_birth' raises a ValidationError."""
    profile_data = {
        "full_name": "Jane Doe"
    }
    with pytest.raises(ValidationError) as exc_info:
        UserProfile(**profile_data)
    # Check that 'date_of_birth' is mentioned in the error details
    assert "date_of_birth" in str(exc_info.value)
