import os
from unittest.mock import patch
from fastapi.testclient import TestClient
from sqlalchemy.engine import URL

from database import get_database_url
from main import app, get_allowed_origins, DEFAULT_ALLOWED_ORIGINS


class TestDatabaseUrlParsing:
    """Test suite verifying cloud database URL resolution and normalization."""

    def test_postgres_scheme_normalized_to_psycopg2(self):
        cloud_url = "postgres://neon_user:secret_pass@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"
        with patch.dict(os.environ, {"DATABASE_URL": cloud_url}, clear=False):
            resolved = get_database_url()
            assert isinstance(resolved, str)
            assert resolved.startswith("postgresql+psycopg2://")
            assert "sslmode=require" in resolved
            assert "neon_user:secret_pass" in resolved
            assert "neondb" in resolved

    def test_postgresql_scheme_normalized_to_psycopg2(self):
        cloud_url = "postgresql://neon_user:secret_pass@ep-cool-sample.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        with patch.dict(os.environ, {"DATABASE_URL": cloud_url}, clear=False):
            resolved = get_database_url()
            assert isinstance(resolved, str)
            assert resolved.startswith("postgresql+psycopg2://")
            assert "sslmode=require" in resolved
            assert "channel_binding=require" in resolved

    def test_already_normalized_driver_preserved(self):
        cloud_url = "postgresql+psycopg2://neon_user:secret_pass@ep-cool-sample.us-east-2.aws.neon.tech/neondb"
        with patch.dict(os.environ, {"DATABASE_URL": cloud_url}, clear=False):
            resolved = get_database_url()
            assert resolved == cloud_url

    def test_fallback_to_local_env_variables(self):
        local_env = {
            "DB_USER": "test_user",
            "DB_PASSWORD": "test_password",
            "DB_HOST": "127.0.0.1",
            "DB_PORT": "5433",
            "DB_NAME": "test_db",
        }
        # Ensure DATABASE_URL is not set
        with patch.dict(os.environ, local_env, clear=True):
            resolved = get_database_url()
            assert isinstance(resolved, URL)
            assert resolved.drivername == "postgresql+psycopg2"
            assert resolved.username == "test_user"
            assert resolved.host == "127.0.0.1"
            assert resolved.port == 5433
            assert resolved.database == "test_db"

    def test_missing_db_port_safely_defaults_to_5432(self):
        local_env = {
            "DB_USER": "local_dev",
            "DB_PASSWORD": "password123",
            "DB_HOST": "localhost",
            "DB_NAME": "skillforge_dev",
        }
        with patch.dict(os.environ, local_env, clear=True):
            resolved = get_database_url()
            assert isinstance(resolved, URL)
            assert resolved.port == 5432


class TestCorsConfiguration:
    """Test suite verifying dynamic and secure CORS resolution."""

    def test_default_origins_when_env_unset(self):
        with patch.dict(os.environ, {"ALLOWED_ORIGINS": ""}, clear=False):
            origins = get_allowed_origins()
            for default_origin in DEFAULT_ALLOWED_ORIGINS:
                assert default_origin in origins

    def test_custom_comma_separated_origins_parsed_and_trimmed(self):
        custom_origins = "https://skillforge-ai.vercel.app, https://custom-domain.com/ , http://localhost:3000 "
        with patch.dict(os.environ, {"ALLOWED_ORIGINS": custom_origins}, clear=False):
            origins = get_allowed_origins()
            assert "https://skillforge-ai.vercel.app" in origins
            assert "https://custom-domain.com" in origins  # Trailing slash trimmed
            assert "http://localhost:3000" in origins

    def test_wildcard_origin_safely_rejected_with_credentials(self):
        with patch.dict(os.environ, {"ALLOWED_ORIGINS": "*, https://safe-domain.com"}, clear=False):
            origins = get_allowed_origins()
            assert "*" not in origins
            assert "https://safe-domain.com" in origins

    def test_cors_headers_emitted_by_api(self):
        client = TestClient(app)
        response = client.get(
            "/api/health",
            headers={"Origin": "http://localhost:3000"}
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert response.headers.get("access-control-allow-credentials") == "true"
