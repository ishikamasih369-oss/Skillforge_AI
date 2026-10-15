from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import (
    CareerRoadmapRequest,
    CareerRoadmapResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
    ResumeReviewRequest,
    ResumeReviewResponse,
)
from ai_service import AIService, get_ai_service

router = APIRouter(prefix="/api/ai", tags=["AI Features"])


@router.post(
    "/resume-review",
    response_model=ResumeReviewResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Resume Reviewer",
    description=(
        "Analyzes a plain-text resume against optional target roles or job descriptions. "
        "Returns strengths, areas for improvement, skill gaps, holistic rubric score, "
        "and truthful recommendations without fabricating achievements."
    ),
)
def review_resume(
    payload: ResumeReviewRequest,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
):
    # Process review securely without logging resume text or credentials
    return service.review_resume(payload)


@router.post(
    "/cover-letter",
    response_model=CoverLetterResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Cover Letter Generator",
    description=(
        "Generates a tailored, professional cover letter using strictly user-supplied experience facts. "
        "Includes a verification checklist of claims to review before submitting."
    ),
)
def generate_cover_letter(
    payload: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
):
    # Process cover letter securely without storing or logging candidate text
    return service.generate_cover_letter(payload)


@router.post(
    "/interview-questions",
    response_model=InterviewQuestionsResponse,
    status_code=status.HTTP_200_OK,
    summary="AI Interview Preparation",
    description=(
        "Generates customized mock interview questions, difficulty ratings, key concepts to cover, "
        "and sample answer outlines tailored to role and experience level."
    ),
)
def generate_interview_questions(
    payload: InterviewQuestionsRequest,
    current_user: User = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
):
    # Generates curated mock questions
    return service.generate_interview_questions(payload)


@router.post(
    "/career-roadmap",
    response_model=CareerRoadmapResponse,
    status_code=status.HTTP_200_OK,
    summary="Personalized AI Career Roadmap",
    description=(
        "Generates a prioritized, phased learning roadmap based on current skills and available study hours. "
        "Cross-references existing courses in the SkillForge database without fabricating nonexistent offerings."
    ),
)
def generate_career_roadmap(
    payload: CareerRoadmapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: AIService = Depends(get_ai_service),
):
    # Cross-references existing database courses with current user's roadmap goals
    return service.generate_career_roadmap(payload, db=db)
