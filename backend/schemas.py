from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime
from typing import Literal


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
class CourseCreate(BaseModel):
    title: str = Field(min_length=2, max_length=150)
    description: str = Field(min_length=10, max_length=1000)
    category: str = Field(min_length=2, max_length=100)
    difficulty: str = Field(min_length=2, max_length=50)
    instructor: str = Field(min_length=2, max_length=100)
    duration_hours: int = Field(gt=0)
    image_url: str | None = Field(default=None, max_length=500)
    is_published: bool = True


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    difficulty: str
    instructor: str
    duration_hours: int
    image_url: str | None
    is_published: bool
class MyCourseResponse(BaseModel):
    course_id: int
    title: str
    description: str
    category: str
    difficulty: str
    instructor: str
    duration_hours: int
    image_url: str | None
    progress: int
    completed: bool      
class ProgressUpdate(BaseModel):
    progress: int = Field(ge=0, le=100)
class DailyGoalCreate(BaseModel):
    target_minutes: int = Field(gt=0, le=1440)    
class GoalProgressUpdate(BaseModel):
    completed_minutes: int = Field(ge=0)   
class InternshipCreate(BaseModel):
    company: str = Field(min_length=2, max_length=150)
    role: str = Field(min_length=2, max_length=150)
    location: str | None = Field(default=None, max_length=150)

    application_date: datetime | None = None
    deadline: datetime | None = None

    status: str = Field(default="Saved", max_length=50)

    job_url: str | None = Field(default=None, max_length=500)
    notes: str | None = Field(default=None, max_length=2000)


class InternshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    role: str
    location: str | None

    application_date: datetime | None
    deadline: datetime | None

    status: str

    job_url: str | None
    notes: str | None



class InternshipStatusUpdate(BaseModel):
    status: Literal[
        "Saved",
        "Applied",
        "Assessment",
        "Interview",
        "Rejected",
        "Selected"
    ]

class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="General", max_length=100)


class NoteUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=5000)
    category: str = Field(default="General", max_length=100)


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: str
    category: str


# ==========================================
# AI Feature Schemas
# ==========================================

# Feature A: AI Resume Reviewer
class ResumeReviewRequest(BaseModel):
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=15000,
        description="Plain text of the candidate resume to evaluate."
    )
    target_role: str | None = Field(
        default=None,
        max_length=200,
        description="Optional target role/title to assess alignment against."
    )
    target_job_description: str | None = Field(
        default=None,
        max_length=10000,
        description="Optional target job description to match skills and qualifications."
    )


class ResumeReviewResponse(BaseModel):
    summary: str
    overall_score: int = Field(
        ge=0,
        le=100,
        description="Holistic evaluation score (0-100) based on clarity, impact, relevance, and skill presentation."
    )
    score_explanation: str = Field(
        description="Explanation clarifying that this score is a holistic rubric analysis and not a proprietary ATS system output."
    )
    strengths: list[str]
    areas_for_improvement: list[str]
    skills_identified: list[str]
    matching_skills: list[str]
    missing_or_weak_skills: list[str]
    actionable_recommendations: list[str]
    disclaimer: str = (
        "This evaluation is AI-generated for educational and preparation purposes. "
        "It provides suggestions and does not guarantee job placement or replicate official ATS algorithms."
    )


# Feature B: AI Cover Letter Generator
class CoverLetterRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=150)
    company_name: str = Field(min_length=2, max_length=150)
    job_description: str = Field(min_length=20, max_length=10000)
    experience_summary: str = Field(
        ...,
        min_length=20,
        max_length=15000,
        description="Candidate resume text or summary of relevant experience."
    )
    tone: Literal["professional", "enthusiastic", "technical", "concise"] = "professional"


class CoverLetterResponse(BaseModel):
    target_role: str
    company_name: str
    cover_letter: str
    verification_checklist: list[str] = Field(
        description="List of specific claims, metrics, dates, or company facts the user must review for accuracy before sending."
    )
    key_highlights_used: list[str] = Field(
        description="Key points truthfully extracted from the user's provided experience."
    )


# Feature C: AI Interview Preparation
class InterviewQuestionsRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=150)
    experience_level: Literal["Entry-level / Intern", "Junior", "Mid-level", "Senior"] = "Entry-level / Intern"
    interview_type: Literal["technical", "behavioral", "mixed", "system_design"] = "mixed"
    skills_or_topics: list[str] | None = Field(default=None, max_length=15)
    job_description: str | None = Field(default=None, max_length=8000)
    num_questions: int = Field(default=5, ge=1, le=15)


class InterviewQuestionItem(BaseModel):
    id: int
    question: str
    category: str
    difficulty: Literal["Easy", "Medium", "Hard"]
    key_concepts: list[str]
    sample_answer_outline: list[str]


class InterviewQuestionsResponse(BaseModel):
    target_role: str
    experience_level: str
    interview_type: str
    questions: list[InterviewQuestionItem]
    preparation_tips: list[str]
    disclaimer: str = (
        "These questions are curated practice prompts tailored to your specified role and level. "
        "They are designed for preparation and are not guaranteed to appear in actual interviews."
    )


# Feature D: AI Career Roadmap
class CareerRoadmapRequest(BaseModel):
    target_role: str = Field(min_length=2, max_length=150)
    current_skills: list[str] = Field(..., min_length=1, max_length=50)
    experience_level: Literal["Beginner / Student", "Intermediate", "Advanced"] = "Beginner / Student"
    weekly_hours_available: int = Field(ge=1, le=80)
    career_goals: str | None = Field(default=None, max_length=500)
    preferred_topics: list[str] | None = Field(default=None, max_length=20)


class RoadmapPhase(BaseModel):
    phase_number: int
    title: str
    duration_weeks: int
    focus_areas: list[str]
    milestones: list[str]
    practice_projects: list[str]
    verification_methods: list[str]
    recommended_topics: list[str]


class CareerRoadmapResponse(BaseModel):
    target_role: str
    experience_level: str
    weekly_hours_available: int
    estimated_total_weeks: int
    current_strengths: list[str]
    skill_gaps: list[str]
    phases: list[RoadmapPhase]
    database_course_matches: list[CourseResponse] = Field(
        default_factory=list,
        description="Relevant courses actually existing in the SkillForge database catalog."
    )
    disclaimer: str = (
        "Timelines and durations are estimates based on your available study time. "
        "Roadmaps guide skill progression and do not guarantee internship or job offers."
    )


# ==========================================
# Study Session Schemas
# ==========================================

class StudySessionStartRequest(BaseModel):
    course_id: int | None = None
    skill_name: str = Field(min_length=1, max_length=150)


class StudySessionUpdateRequest(BaseModel):
    duration_seconds: int = Field(ge=0, description="Corrected duration in seconds")
    skill_name: str | None = Field(default=None, min_length=1, max_length=150)


class StudySessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    course_id: int | None
    course_title: str | None = None
    skill_name: str
    start_time: datetime
    end_time: datetime | None
    duration_seconds: int
    is_active: bool
    is_paused: bool
    current_elapsed_seconds: int = 0
    created_at: datetime


class StudyStatsResponse(BaseModel):
    today_study_seconds: int
    week_study_seconds: int
    current_streak_days: int
    total_sessions_count: int
    recent_sessions: list[StudySessionResponse]


# ==========================================
# Course Lesson & Milestone Schemas
# ==========================================

class LessonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    title: str
    description: str
    order_index: int
    duration_minutes: int
    is_completed: bool = False
    completed_at: datetime | None = None


class CourseLessonsProgressResponse(BaseModel):
    course_id: int
    total_lessons: int
    completed_lessons: int
    progress_percent: int
    completed: bool
    lessons: list[LessonResponse]
