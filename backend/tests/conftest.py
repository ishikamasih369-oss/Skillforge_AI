import pytest
from fastapi.testclient import TestClient

from main import app
from models import User
from auth import get_current_user, create_access_token


@pytest.fixture
def mock_user():
    return User(
        id=1,
        name="Test Candidate",
        email="test.candidate@example.com",
        password_hash="mock_hash"
    )


@pytest.fixture
def client(mock_user):
    # Override get_current_user for authenticated tests
    app.dependency_overrides[get_current_user] = lambda: mock_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client():
    # TestClient without any dependency overrides
    app.dependency_overrides.clear()
    with TestClient(app) as test_client:
        yield test_client
