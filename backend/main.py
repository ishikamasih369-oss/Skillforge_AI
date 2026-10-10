from courses import router as courses_router
from fastapi import FastAPI
from sqlalchemy import text
from goals import router as goals_router
from notes import router as notes_router
from dashboard import router as dashboard_router

from auth import router as auth_router
from database import Base, engine
from internships import router as internships_router

import models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkillForge AI API",
    description="Backend API for the SkillForge AI platform",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(courses_router)
app.include_router(goals_router)
app.include_router(internships_router)
app.include_router(notes_router)

app.include_router(dashboard_router)

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