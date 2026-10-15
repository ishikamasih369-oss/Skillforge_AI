"""Optional Live Ollama Integration Test Script.

This script tests the live local Ollama service against the configured OLLAMA_MODEL.
It is separated from automated unit tests and is NOT run by default pytest.

To run this manually once you have Ollama running locally:
    1. Ensure Ollama is running: ollama serve
    2. Ensure the model is downloaded: ollama pull gemma3:4b
    3. Run: .venv/Scripts/python.exe tests/test_live_ai_manual.py
"""

import os
import sys
from pathlib import Path
import httpx
import ollama

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from ai_service import AIService
from schemas import (
    CareerRoadmapRequest,
    CoverLetterRequest,
    InterviewQuestionsRequest,
    ResumeReviewRequest,
)


def run_live_tests():
    service = AIService()
    base_url = service.base_url
    model_name = service.model_name

    print(f"\n[INFO] Connecting to local Ollama at: {base_url}")
    print(f"[INFO] Using configured model: {model_name}")
    print(f"[INFO] Configured timeout: {service.timeout}s")

    client = service.get_client()

    # 1. Check if Ollama is reachable
    try:
        models_response = client.list()
        available_models = [m.model for m in getattr(models_response, "models", [])]
        print(f"[INFO] Ollama connection successful! Available models: {available_models or 'None found'}")
    except (httpx.ConnectError, ollama.RequestError, Exception) as err:
        print(f"\n[SKIP] Ollama is not running or unreachable at {base_url}.")
        print("To run live tests with Ollama:")
        print("  1. Download and install Ollama from https://ollama.com")
        print("  2. Start the Ollama server: ollama serve")
        print(f"  3. Download the model: ollama pull {model_name}")
        print("  4. Re-run this script.")
        return

    # 2. Check if model is pulled
    # Match model name ignoring tags or with tags
    model_matched = any(
        m == model_name or m.startswith(f"{model_name}:") or model_name.startswith(f"{m}:")
        for m in available_models
    )
    if not model_matched and available_models:
        print(f"\n[SKIP] Configured model '{model_name}' was not found in local Ollama.")
        print(f"To download the model, run: ollama pull {model_name}")
        print("Then re-run this script.")
        return

    print(f"\n[INFO] Running live inference with Ollama model '{model_name}'...")

    # Test 1: Resume Review
    print("\n1. Testing Resume Review...")
    resume_req = ResumeReviewRequest(
        resume_text=(
            "Jane Doe | Computer Science Student at State University\n"
            "Skills: Python, FastAPI, PostgreSQL, Git\n"
            "Project: Built SkillForge AI full-stack learning platform with JWT auth and REST APIs.\n"
            "Experience: Academic Tutor for Data Structures & Algorithms (2025-2026)."
        ),
        target_role="Software Engineer Intern",
        target_job_description="Seeking a motivated SWE intern with Python backend skills."
    )
    resume_res = service.review_resume(resume_req)
    print(f"   Score: {resume_res.overall_score}/100")
    print(f"   Summary: {resume_res.summary[:80]}...")
    print(f"   Identified Skills: {resume_res.skills_identified}")

    # Test 2: Cover Letter
    print("\n2. Testing Cover Letter...")
    cl_req = CoverLetterRequest(
        target_role="Backend Developer Intern",
        company_name="CloudScale Technologies",
        job_description="Looking for an intern to assist in building RESTful microservices with Python.",
        experience_summary="Developed backend REST APIs using FastAPI and PostgreSQL with unit tests and JWT auth.",
        tone="professional"
    )
    cl_res = service.generate_cover_letter(cl_req)
    print(f"   Letter length: {len(cl_res.cover_letter)} chars")
    print(f"   Verification Checklist: {cl_res.verification_checklist}")

    # Test 3: Interview Questions
    print("\n3. Testing Interview Preparation...")
    iq_req = InterviewQuestionsRequest(
        target_role="Python Backend Intern",
        experience_level="Entry-level / Intern",
        interview_type="technical",
        skills_or_topics=["Python", "FastAPI", "SQL"],
        num_questions=2
    )
    iq_res = service.generate_interview_questions(iq_req)
    print(f"   Generated {len(iq_res.questions)} questions:")
    for q in iq_res.questions:
        print(f"     - [{q.difficulty}] {q.category}: {q.question[:60]}...")

    # Test 4: Career Roadmap
    print("\n4. Testing Career Roadmap...")
    rm_req = CareerRoadmapRequest(
        target_role="Junior Backend Engineer",
        current_skills=["Python", "Basic SQL", "Git"],
        experience_level="Beginner / Student",
        weekly_hours_available=15,
        career_goals="Prepare for summer backend internships"
    )
    rm_res = service.generate_career_roadmap(rm_req)
    print(f"   Estimated duration: {rm_res.estimated_total_weeks} weeks")
    print(f"   Phases planned: {len(rm_res.phases)}")
    for p in rm_res.phases:
        print(f"     - Phase {p.phase_number}: {p.title} ({p.duration_weeks} weeks)")

    print("\n[SUCCESS] All live Ollama AI tests completed successfully!")


if __name__ == "__main__":
    run_live_tests()
