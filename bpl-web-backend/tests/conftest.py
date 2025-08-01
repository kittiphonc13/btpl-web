import sys
import os
import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

# Add the project root directory to the Python path.
# This must be done before importing any application modules.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from bpl_web_backend.main import app
from bpl_web_backend.dependencies import get_current_user
from unittest.mock import MagicMock

@pytest.fixture(scope="session")
def client():
    """Sync Test Client for making API requests without authentication."""
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="session")
def mock_user():
    """Mock user fixture for authenticated tests."""
    user = MagicMock()
    user.id = "test-user-123"
    return user

@pytest.fixture(scope="function")
def auth_client(mock_user):
    """Sync Test Client with an authenticated user."""
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear() # Clean up after tests

@pytest.fixture(scope="session")
async def async_client():
    """Async Test Client for making API requests."""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
