from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from datetime import datetime



from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    difficulty = Column(String(50), nullable=False)
    instructor = Column(String(100), nullable=False)
    duration_hours = Column(Integer, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
class UserCourse(Base):
    __tablename__ = "user_courses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    progress = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
class DailyGoal(Base):
    __tablename__ = "daily_goals"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    goal_date = Column(DateTime, nullable=False)

    target_minutes = Column(Integer, nullable=False)
    completed_minutes = Column(Integer, default=0, nullable=False)

    completed = Column(Boolean, default=False, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )     
class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    company = Column(String(150), nullable=False)
    role = Column(String(150), nullable=False)
    location = Column(String(150), nullable=True)

    application_date = Column(DateTime, nullable=True)
    deadline = Column(DateTime, nullable=True)

    status = Column(String(50), default="Saved", nullable=False)

    job_url = Column(String(500), nullable=True)
    notes = Column(String(2000), nullable=True)

    created_at = Column(
         DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )   

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)

    title = Column(String(200), nullable=False)
    content = Column(String(5000), nullable=False)
    category = Column(String(100), default="General", nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=True, index=True)
    skill_name = Column(String(150), nullable=False)

    start_time = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0, nullable=False)

    is_active = Column(Boolean, default=True, nullable=False, index=True)
    is_paused = Column(Boolean, default=False, nullable=False)
    last_resumed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )


class CourseLesson(Base):
    __tablename__ = "course_lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False)
    order_index = Column(Integer, default=1, nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class UserLessonCompletion(Base):
    __tablename__ = "user_lesson_completions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    lesson_id = Column(Integer, nullable=False, index=True)
    completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
