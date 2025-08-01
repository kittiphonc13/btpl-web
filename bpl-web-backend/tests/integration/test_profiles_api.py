from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from bpl_web_backend.main import app
from bpl_web_backend.dependencies import get_current_user
from gotrue.types import User
from postgrest.exceptions import APIError
from datetime import datetime

client = TestClient(app)

# Mock user for dependency injection
mock_user = User(
    id='a1b2c3d4-e5f6-7890-1234-567890abcdef', 
    email='test@example.com',
    app_metadata={},
    user_metadata={},
    aud='authenticated',
    created_at=datetime.now()
)
