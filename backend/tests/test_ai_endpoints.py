import json
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

from ai_service import get_ai_service, AIService
from main import app


def create_mock_ollama_response(content_data: dict | str):
    raw_content = content_data if isinstance(content_data, str) else json.dumps(content_data)
    mock_msg = MagicMock()
    mock_msg.content = raw_content
    mock_response = MagicMock()
    mock_response.message = mock_msg
    return mock_response


# ============================================================================
# Authentication Enforcement Tests (401 Unauthorized)
# ============================================================================
def test_unauthenticated_resume_review(unauthenticated_client):
    res = unauthenticated_client.post(
        "/api/ai/resume-review",
        json={"resume_text": "Sample resume text that satisfies length requirements."}
    )
    assert res.status_code == 401 or res.status_code == 403


def test_unauthenticated_cover_letter(unauthenticated_client):
    res = unauthenticated_client.post(
        "/api/ai/cover-letter",
        json={
            "target_role": "Backend Engineer",
            "company_name": "Google",
            "job_description": "We are seeking a great backend engineer.",
            "experience_summary": "I have experience with Python and algorithms."
        }
    )
    assert res.status_code == 401 or res.status_code == 403


def test_unauthenticated_interview_questions(unauthenticated_client):
    res = unauthenticated_client.post(
        "/api/ai/interview-questions",
        json={"target_role": "Backend Engineer"}
    )
    assert res.status_code == 401 or res.status_code == 403


def test_unauthenticated_career_roadmap(unauthenticated_client):
    res = unauthenticated_client.post(
        "/api/ai/career-roadmap",
        json={
            "target_role": "Backend Engineer",
            "current_skills": ["Python"],
            "weekly_hours_available": 10
        }
    )
    assert res.status_code == 401 or res.status_code == 403


# ============================================================================
# Validation Error Tests (422 Unprocessable Entity)
# ============================================================================
def test_resume_review_too_short(client):
    # Resume text requires at least 50 chars
    res = client.post(
        "/api/ai/resume-review",
        json={"resume_text": "Too short"}
    )
    assert res.status_code == 422


def test_resume_review_excessive_length(client):
    # Resume text max length is 15000 chars
    res = client.post(
        "/api/ai/resume-review",
        json={"resume_text": "A" * 15001}
    )
    assert res.status_code == 422


def test_cover_letter_empty_fields(client):
    res = client.post(
        "/api/ai/cover-letter",
        json={
            "target_role": "",
            "company_name": "",
            "job_description": "",
            "experience_summary": ""
        }
    )
    assert res.status_code == 422


def test_interview_questions_invalid_number_limit(client):
    # num_questions must be between 1 and 15
    res = client.post(
        "/api/ai/interview-questions",
        json={
            "target_role": "Software Engineer",
            "num_questions": 50
        }
    )
    assert res.status_code == 422


def test_career_roadmap_missing_skills(client):
    res = client.post(
        "/api/ai/career-roadmap",
        json={
            "target_role": "Backend Engineer",
            "current_skills": [],
            "weekly_hours_available": 10
        }
    )
    assert res.status_code == 422


# ============================================================================
# Successful Endpoint Execution (200 OK with Mocked AI Service)
# ============================================================================
def test_endpoint_resume_review_success(client):
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "summary": "Solid student resume with relevant project experience.",
        "overall_score": 88,
        "score_explanation": "Evaluated based on clear impact and modern tech stack.",
        "strengths": ["Strong FastAPI usage", "Good data modeling"],
        "areas_for_improvement": ["Add test coverage metrics"],
        "skills_identified": ["Python", "FastAPI", "PostgreSQL"],
        "matching_skills": ["Python", "FastAPI"],
        "missing_or_weak_skills": ["Docker"],
        "actionable_recommendations": ["Include bullet points with % metrics"]
    })
    mock_service = AIService(client=mock_client)
    app.dependency_overrides[get_ai_service] = lambda: mock_service

    payload = {
        "resume_text": "John Doe - Software Engineer candidate with experience in Python, FastAPI, and PostgreSQL building REST APIs.",
        "target_role": "Python Backend Intern",
        "target_job_description": "We need a junior Python backend engineer experienced with FastAPI and relational databases."
    }

    res = client.post("/api/ai/resume-review", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["overall_score"] == 88
    assert "Solid student resume" in data["summary"]
    assert "Python" in data["skills_identified"]
    assert "disclaimer" in data


def test_endpoint_cover_letter_success(client):
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "cover_letter": "Dear Hiring Manager at Innovate Inc,\n\nI am thrilled to apply for the Backend Engineer position...",
        "verification_checklist": ["Confirm correct recipient department", "Check graduation date"],
        "key_highlights_used": ["FastAPI architecture", "Database optimization"]
    })
    mock_service = AIService(client=mock_client)
    app.dependency_overrides[get_ai_service] = lambda: mock_service

    payload = {
        "target_role": "Backend Engineer Intern",
        "company_name": "Innovate Inc",
        "job_description": "Looking for passionate software interns with experience in Python web frameworks.",
        "experience_summary": "Computer science student who built SkillForge AI using FastAPI, PostgreSQL, and SQLAlchemy.",
        "tone": "professional"
    }

    res = client.post("/api/ai/cover-letter", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["company_name"] == "Innovate Inc"
    assert "Dear Hiring Manager" in data["cover_letter"]
    assert len(data["verification_checklist"]) == 2
    assert len(data["key_highlights_used"]) == 2


def test_endpoint_interview_questions_success(client):
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "questions": [
            {
                "id": 1,
                "question": "Explain how database transactions work and what ACID stands for.",
                "category": "Databases",
                "difficulty": "Easy",
                "key_concepts": ["Atomicity", "Consistency", "Isolation", "Durability"],
                "sample_answer_outline": ["Define ACID properties", "Explain practical rollback scenarios"]
            }
        ],
        "preparation_tips": ["Review database isolation levels before the interview"]
    })
    mock_service = AIService(client=mock_client)
    app.dependency_overrides[get_ai_service] = lambda: mock_service

    payload = {
        "target_role": "Backend Intern",
        "experience_level": "Entry-level / Intern",
        "interview_type": "technical",
        "skills_or_topics": ["SQL", "Databases"],
        "num_questions": 1
    }

    res = client.post("/api/ai/interview-questions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["questions"]) == 1
    assert data["questions"][0]["difficulty"] == "Easy"
    assert "Atomicity" in data["questions"][0]["key_concepts"]
    assert "disclaimer" in data


def test_endpoint_career_roadmap_success(client):
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "estimated_total_weeks": 8,
        "current_strengths": ["Basic Python", "FastAPI endpoints"],
        "skill_gaps": ["Docker", "Redis", "Unit Testing with Pytest"],
        "phases": [
            {
                "phase_number": 1,
                "title": "Testing & Quality Assurance",
                "duration_weeks": 2,
                "focus_areas": ["Pytest", "TestClient", "Fixtures"],
                "milestones": ["Achieve 85% test coverage on API routes"],
                "practice_projects": ["Automated test suite for auth and CRUD"],
                "verification_methods": ["Run pytest with pytest-cov and check reports"],
                "recommended_topics": ["Mocking external HTTP calls"]
            }
        ]
    })
    mock_service = AIService(client=mock_client)
    app.dependency_overrides[get_ai_service] = lambda: mock_service

    payload = {
        "target_role": "Junior Backend Engineer",
        "current_skills": ["Python", "FastAPI"],
        "experience_level": "Beginner / Student",
        "weekly_hours_available": 12,
        "career_goals": "Prepare for backend internship interviews"
    }

    res = client.post("/api/ai/career-roadmap", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["estimated_total_weeks"] == 8
    assert len(data["phases"]) == 1
    assert data["phases"][0]["title"] == "Testing & Quality Assurance"
    assert "disclaimer" in data
