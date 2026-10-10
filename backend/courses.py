from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas import CourseCreate, CourseResponse, MyCourseResponse,ProgressUpdate
from database import get_db
from models import Course, UserCourse
from schemas import CourseCreate, CourseResponse
from auth import get_current_user
from models import User
router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db)):
    new_course = Course(
        title=course.title,
        description=course.description,
        category=course.category,
        difficulty=course.difficulty,
        instructor=course.instructor,
        duration_hours=course.duration_hours,
        image_url=course.image_url,
        is_published=course.is_published
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course


@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    return db.query(Course).all()


@router.get("/my-courses", response_model=list[MyCourseResponse])
def get_my_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    results = (
        db.query(Course, UserCourse)
        .join(
            UserCourse,
            Course.id == UserCourse.course_id
        )
        .filter(UserCourse.user_id == current_user.id)
        .all()
    )

    return [
        {
            "course_id": course.id,
            "title": course.title,
            "description": course.description,
            "category": course.category,
            "difficulty": course.difficulty,
            "instructor": course.instructor,
            "duration_hours": course.duration_hours,
            "image_url": course.image_url,
            "progress": enrollment.progress,
            "completed": enrollment.completed
        }
        for course, enrollment in results
    ]
@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    return course
@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseCreate,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    course.title = course_data.title
    course.description = course_data.description
    course.category = course_data.category
    course.difficulty = course_data.difficulty
    course.instructor = course_data.instructor
    course.duration_hours = course_data.duration_hours
    course.image_url = course_data.image_url
    course.is_published = course_data.is_published

    db.commit()
    db.refresh(course)

    return course
@router.delete("/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    db.delete(course)
    db.commit()

    return {
        "message": "Course deleted successfully"
    }
@router.post("/{course_id}/enroll")
def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(
            status_code=404,
            detail="Course not found"
        )

    existing_enrollment = (
        db.query(UserCourse)
        .filter(
            UserCourse.user_id == current_user.id,
            UserCourse.course_id == course_id
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=400,
            detail="You are already enrolled in this course"
        )

    enrollment = UserCourse(
        user_id=current_user.id,
        course_id=course_id,
        progress=0,
        completed=False
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Successfully enrolled in the course",
        "course_id": course_id,
        "user_id": current_user.id,
        "progress": enrollment.progress,
        "completed": enrollment.completed
    }
@router.put("/{course_id}/progress")
def update_progress(
    course_id: int,
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    enrollment = (
        db.query(UserCourse)
        .filter(
            UserCourse.user_id == current_user.id,
            UserCourse.course_id == course_id
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=404,
            detail="You are not enrolled in this course"
        )

    enrollment.progress = progress_data.progress

    if enrollment.progress == 100:
        enrollment.completed = True
    else:
        enrollment.completed = False

    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Progress updated successfully",
        "course_id": course_id,
        "progress": enrollment.progress,
        "completed": enrollment.completed
    }