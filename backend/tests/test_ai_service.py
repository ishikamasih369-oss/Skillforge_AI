import json
from unittest.mock import MagicMock
import httpx
import ollama
import pytest
from fastapi import HTTPException

from ai_service import AIService
from schemas import (
    CareerRoadmapRequest,
    CoverLetterRequest,
    InterviewQuestionsRequest,
    ResumeReviewRequest,
)


def create_mock_ollama_response(content_data: dict | str):
    raw_content = content_data if isinstance(content_data, str) else json.dumps(content_data)
    mock_msg = MagicMock()
    mock_msg.content = raw_content
    mock_response = MagicMock()
    mock_response.message = mock_msg
    return mock_response


def test_default_configuration():
    service = AIService()
    assert service.base_url == "http://localhost:11434"
    assert service.model_name == "gemma3:4b"
    assert service.timeout == 180.0


def test_custom_environment_configuration(monkeypatch):
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://custom-ollama:11434/")
    monkeypatch.setenv("OLLAMA_MODEL", "custom-model:latest")
    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "240")
    service = AIService()
    assert service.base_url == "http://custom-ollama:11434"
    assert service.model_name == "custom-model:latest"
    assert service.timeout == 240.0


def test_invalid_timeout_falls_back_to_default(monkeypatch):
    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "invalid_number")
    service = AIService()
    assert service.timeout == 180.0

    monkeypatch.setenv("OLLAMA_TIMEOUT_SECONDS", "-10")
    service2 = AIService()
    assert service2.timeout == 180.0


def test_ollama_client_uses_configured_timeout():
    service = AIService()
    client = service.get_client()
    assert client._client.timeout.read == 180.0



def test_resume_review_success():
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "summary": "Strong engineering background with good project achievements.",
        "overall_score": 85,
        "score_explanation": "Score based on clarity, metrics, and technology match.",
        "strengths": ["Clear Git experience", "Good backend architecture"],
        "areas_for_improvement": ["Add more quantified metrics"],
        "skills_identified": ["Python", "FastAPI", "SQL"],
        "matching_skills": ["Python", "FastAPI"],
        "missing_or_weak_skills": ["Docker (recommended)"],
        "actionable_recommendations": ["Highlight test coverage numbers"]
    })

    service = AIService(client=mock_client)
    req = ResumeReviewRequest(
        resume_text="Experienced Python backend developer with FastAPI and PostgreSQL expertise.",
        target_role="Backend Developer",
        target_job_description="Looking for Python and FastAPI developer."
    )
    result = service.review_resume(req)

    assert result.overall_score == 85
    assert "Strong engineering background" in result.summary
    assert len(result.strengths) == 2
    assert "Python" in result.skills_identified
    assert mock_client.chat.called


def test_cover_letter_success():
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "cover_letter": "Dear Hiring Manager,\n\nI am writing to express my enthusiasm...",
        "verification_checklist": ["Verify company division name", "Confirm start date"],
        "key_highlights_used": ["FastAPI API design", "PostgreSQL database optimization"]
    })

    service = AIService(client=mock_client)
    req = CoverLetterRequest(
        target_role="Software Engineer Intern",
        company_name="TechCorp",
        job_description="Seeking a motivated software engineering intern with Python skills.",
        experience_summary="Built multiple REST APIs with Python, FastAPI, and PostgreSQL during coursework.",
        tone="professional"
    )
    result = service.generate_cover_letter(req)

    assert result.company_name == "TechCorp"
    assert "Dear Hiring Manager" in result.cover_letter
    assert len(result.verification_checklist) == 2
    assert len(result.key_highlights_used) == 2


def test_interview_questions_success():
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "questions": [
            {
                "id": 1,
                "question": "How do you optimize an N+1 query problem in SQLAlchemy?",
                "category": "Databases",
                "difficulty": "Medium",
                "key_concepts": ["joinedload", "selectinload", "eager loading"],
                "sample_answer_outline": ["Identify query bottleneck", "Use eager loading strategies"]
            }
        ],
        "preparation_tips": ["Review SQL indexes", "Practice query plans"]
    })

    service = AIService(client=mock_client)
    req = InterviewQuestionsRequest(
        target_role="Backend Developer",
        experience_level="Junior",
        interview_type="technical",
        skills_or_topics=["SQLAlchemy", "PostgreSQL"],
        num_questions=1
    )
    result = service.generate_interview_questions(req)

    assert len(result.questions) == 1
    assert result.questions[0].difficulty == "Medium"
    assert "joinedload" in result.questions[0].key_concepts
    assert len(result.preparation_tips) == 2


def test_career_roadmap_success():
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response({
        "estimated_total_weeks": 12,
        "current_strengths": ["Basic Python syntax"],
        "skill_gaps": ["Asynchronous programming", "Distributed caching"],
        "phases": [
            {
                "phase_number": 1,
                "title": "Advanced Python & AsyncIO",
                "duration_weeks": 4,
                "focus_areas": ["Async/await", "Coroutines"],
                "milestones": ["Build async crawler"],
                "practice_projects": ["High-concurrency worker"],
                "verification_methods": ["Pass concurrency load test"],
                "recommended_topics": ["AnyIO", "asyncio"]
            }
        ]
    })

    service = AIService(client=mock_client)
    req = CareerRoadmapRequest(
        target_role="Backend Engineer",
        current_skills=["Python", "Git"],
        experience_level="Beginner / Student",
        weekly_hours_available=15,
        career_goals="Land an internship in summer"
    )
    result = service.generate_career_roadmap(req, db=None)

    assert result.estimated_total_weeks == 12
    assert len(result.phases) == 1
    assert result.phases[0].title == "Advanced Python & AsyncIO"
    assert "Basic Python syntax" in result.current_strengths


def test_markdown_code_block_stripping_success():
    payload_dict = {
        "summary": "Valid resume.",
        "overall_score": 90,
        "score_explanation": "Good rubric match.",
        "strengths": ["Strong skills"],
        "areas_for_improvement": [],
        "skills_identified": ["Python"],
        "matching_skills": ["Python"],
        "missing_or_weak_skills": [],
        "actionable_recommendations": []
    }
    # Wrap in markdown fences like some local LLMs output
    wrapped_json = f"```json\n{json.dumps(payload_dict)}\n```"

    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response(wrapped_json)

    service = AIService(client=mock_client)
    req = ResumeReviewRequest(
        resume_text="Experienced Python backend developer with FastAPI and PostgreSQL expertise."
    )
    result = service.review_resume(req)
    assert result.overall_score == 90
    assert "Valid resume." in result.summary


def test_ollama_connection_error_raises_503():
    mock_client = MagicMock()
    mock_client.chat.side_effect = httpx.ConnectError("Connection refused to 127.0.0.1:11434")
    service = AIService(client=mock_client)

    req = ResumeReviewRequest(
        resume_text="A very detailed resume for testing connection error handling in the service.",
        target_role="Engineer"
    )
    with pytest.raises(HTTPException) as exc_info:
        service.review_resume(req)
    assert exc_info.value.status_code == 503
    assert "ollama service is not running" in exc_info.value.detail.lower()


def test_ollama_model_not_found_raises_503():
    mock_client = MagicMock()
    mock_client.chat.side_effect = ollama.ResponseError("model 'gemma3:4b' not found, try pulling it first", status_code=404)
    service = AIService(client=mock_client)

    req = CoverLetterRequest(
        target_role="Developer",
        company_name="Acme",
        job_description="Need Python developer with good communication skills.",
        experience_summary="Extensive Python coding experience.",
        tone="professional"
    )
    with pytest.raises(HTTPException) as exc_info:
        service.generate_cover_letter(req)
    assert exc_info.value.status_code == 503
    assert "ollama pull" in exc_info.value.detail.lower()


def test_ollama_timeout_raises_504():
    mock_client = MagicMock()
    mock_client.chat.side_effect = httpx.TimeoutException("Read timeout occurred")
    service = AIService(client=mock_client)

    req = ResumeReviewRequest(
        resume_text="A very detailed resume for testing timeout handling in the service.",
        target_role="Engineer"
    )
    with pytest.raises(HTTPException) as exc_info:
        service.review_resume(req)
    assert exc_info.value.status_code == 504
    assert "timed out after 180s" in exc_info.value.detail.lower()



def test_malformed_json_raises_502():
    mock_client = MagicMock()
    mock_client.chat.return_value = create_mock_ollama_response("Not a JSON document at all!")

    service = AIService(client=mock_client)
    req = ResumeReviewRequest(
        resume_text="Resume text with enough characters to pass validation correctly.",
        target_role="Tester"
    )
    with pytest.raises(HTTPException) as exc_info:
        service.review_resume(req)
    assert exc_info.value.status_code == 502
    assert "invalid JSON response" in exc_info.value.detail
