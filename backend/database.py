import os
from pathlib import Path

from urllib.parse import urlparse, urlunparse

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure .env is reliably loaded regardless of the current working directory
_backend_dir = Path(__file__).resolve().parent
_backend_env = _backend_dir / ".env"
_root_env = _backend_dir.parent / ".env"

if _root_env.is_file():
    load_dotenv(dotenv_path=_root_env)
if _backend_env.is_file():
    load_dotenv(dotenv_path=_backend_env, override=True)
else:
    load_dotenv()


def get_database_url() -> str | URL:
    """Resolve and normalize database connection URL from environment variables.

    Supports DATABASE_URL for cloud providers (e.g. Neon, Render),
    normalizing 'postgres://' or 'postgresql://' schemes to 'postgresql+psycopg2://'
    while preserving all connection parameters and query strings (e.g., sslmode=require).
    Falls back to individual DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, and DB_NAME
    variables for local development, safely defaulting DB_PORT to 5432 if absent.
    """
    raw_url = os.getenv("DATABASE_URL")
    if raw_url and raw_url.strip():
        url_str = raw_url.strip()
        parsed = urlparse(url_str)
        if parsed.scheme in ("postgres", "postgresql"):
            url_str = urlunparse(parsed._replace(scheme="postgresql+psycopg2"))
        return url_str

    port_env = os.getenv("DB_PORT")
    port = int(port_env.strip()) if port_env and port_env.strip().isdigit() else 5432

    return URL.create(
        drivername="postgresql+psycopg2",
        username=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=port,
        database=os.getenv("DB_NAME"),
    )


database_url = get_database_url()

engine = create_engine(
    database_url,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()