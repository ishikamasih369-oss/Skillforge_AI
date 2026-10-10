from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Literal


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True
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
    id: int
    title: str
    description: str
    category: str
    difficulty: str
    instructor: str
    duration_hours: int
    image_url: str | None
    is_published: bool

    class Config:
        from_attributes = True        
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
    id: int
    company: str
    role: str
    location: str | None

    application_date: datetime | None
    deadline: datetime | None

    status: str

    job_url: str | None
    notes: str | None

    class Config:
        from_attributes = True           



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
    id: int
    title: str
    content: str
    category: str

    class Config:
        from_attributes = True
