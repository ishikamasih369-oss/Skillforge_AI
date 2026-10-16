import os

from courses import router as courses_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from goals import router as goals_router
from notes import router as notes_router
from dashboard import router as dashboard_router

from auth import router as auth_router
from database import Base, engine
from internships import router as internships_router
from ai import router as ai_router
from study_sessions import router as study_sessions_router

import models

Base.metadata.create_all(bind=engine)

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def get_allowed_origins() -> list[str]:
    """Parse configured CORS origins from environment while preserving local development defaults."""
    origins = list(DEFAULT_ALLOWED_ORIGINS)
    raw_env = os.getenv("ALLOWED_ORIGINS", "")
    if raw_env and raw_env.strip():
        for entry in raw_env.split(","):
            cleaned = entry.strip().rstrip("/")
            # Security guard: never allow wildcard '*' when allow_credentials=True
            if cleaned and cleaned != "*" and cleaned not in origins:
                origins.append(cleaned)
    return origins


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure database tables and starter course catalog are initialized on startup."""
    try:
        from database import SessionLocal
        from seed_courses import seed_starter_courses
        with SessionLocal() as db:
            seed_starter_courses(db)
    except Exception:
        pass
    yield


app = FastAPI(
    title="SkillForge AI API",
    description="Backend API for the SkillForge AI platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(goals_router)
app.include_router(internships_router)
app.include_router(notes_router)
app.include_router(dashboard_router)
app.include_router(study_sessions_router)
app.include_router(ai_router)



@app.get("/")
def root():
    return {
        "message": "SkillForge AI API is running 🚀"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SkillForge AI"
    }


@app.get("/api/database-test")
def database_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "success",
            "database": "PostgreSQL",
            "message": "Database connection successful!"
        }

    except Exception as error:
        return {
            "status": "error",
            "message": str(error)
        }
