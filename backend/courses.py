from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from schemas import (
    CourseCreate,
    CourseLessonsProgressResponse,
    CourseResponse,
    LessonResponse,
    MyCourseResponse,
    ProgressUpdate,
)
from database import get_db
from models import Course, CourseLesson, User, UserCourse, UserLessonCompletion
from auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/courses", tags=["Courses"])


@router.post("/", response_model=CourseResponse)
def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
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
    current_user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
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


@router.get("/{course_id}/lessons", response_model=CourseLessonsProgressResponse)
def get_course_lessons(
    course_id: int,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all structured lessons/milestones for a course, annotated with completion state for the user."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    lessons = (
        db.query(CourseLesson)
        .filter(CourseLesson.course_id == course_id)
        .order_by(CourseLesson.order_index.asc())
        .all()
    )

    completed_map: dict[int, datetime] = {}
    if current_user:
        completions = (
            db.query(UserLessonCompletion)
            .filter(
                UserLessonCompletion.course_id == course_id,
                UserLessonCompletion.user_id == current_user.id,
                UserLessonCompletion.completed == True,
            )
            .all()
        )
        for c in completions:
            completed_map[c.lesson_id] = c.completed_at

    total_lessons = len(lessons)
    completed_count = len(completed_map)
    progress_percent = (
        int(round((completed_count / total_lessons) * 100))
        if total_lessons > 0
        else 0
    )
    is_completed = (progress_percent == 100) if total_lessons > 0 else False

    annotated_lessons = [
        {
            "id": lesson.id,
            "course_id": lesson.course_id,
            "title": lesson.title,
            "description": lesson.description,
            "order_index": lesson.order_index,
            "duration_minutes": lesson.duration_minutes,
            "is_completed": lesson.id in completed_map,
            "completed_at": completed_map.get(lesson.id),
        }
        for lesson in lessons
    ]

    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_count,
        "progress_percent": progress_percent,
        "completed": is_completed,
        "lessons": annotated_lessons,
    }


@router.post("/{course_id}/lessons/{lesson_id}/toggle", response_model=CourseLessonsProgressResponse)
def toggle_course_lesson(
    course_id: int,
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle completion of a lesson milestone and recalculate overall course progress percentage."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    lesson = (
        db.query(CourseLesson)
        .filter(
            CourseLesson.id == lesson_id,
            CourseLesson.course_id == course_id,
        )
        .first()
    )
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson milestone not found for this course",
        )

    completion = (
        db.query(UserLessonCompletion)
        .filter(
            UserLessonCompletion.user_id == current_user.id,
            UserLessonCompletion.course_id == course_id,
            UserLessonCompletion.lesson_id == lesson_id,
        )
        .first()
    )

    now = datetime.utcnow()
    if completion:
        completion.completed = not completion.completed
        completion.completed_at = now if completion.completed else completion.completed_at
    else:
        completion = UserLessonCompletion(
            user_id=current_user.id,
            course_id=course_id,
            lesson_id=lesson_id,
            completed=True,
            completed_at=now,
        )
        db.add(completion)

    db.commit()

    # Recalculate progress across all lessons for this course
    total_lessons = (
        db.query(CourseLesson)
        .filter(CourseLesson.course_id == course_id)
        .count()
    )
    completed_count = (
        db.query(UserLessonCompletion)
        .filter(
            UserLessonCompletion.user_id == current_user.id,
            UserLessonCompletion.course_id == course_id,
            UserLessonCompletion.completed == True,
        )
        .count()
    )

    progress_percent = (
        int(round((completed_count / total_lessons) * 100))
        if total_lessons > 0
        else 0
    )
    is_completed = (progress_percent == 100) if total_lessons > 0 else False

    # Synchronize UserCourse enrollment record automatically
    enrollment = (
        db.query(UserCourse)
        .filter(
            UserCourse.user_id == current_user.id,
            UserCourse.course_id == course_id,
        )
        .first()
    )
    if enrollment:
        enrollment.progress = progress_percent
        enrollment.completed = is_completed
    else:
        enrollment = UserCourse(
            user_id=current_user.id,
            course_id=course_id,
            progress=progress_percent,
            completed=is_completed,
        )
        db.add(enrollment)

    db.commit()

    # Return full updated progress response
    all_lessons = (
        db.query(CourseLesson)
        .filter(CourseLesson.course_id == course_id)
        .order_by(CourseLesson.order_index.asc())
        .all()
    )
    active_completions = (
        db.query(UserLessonCompletion)
        .filter(
            UserLessonCompletion.user_id == current_user.id,
            UserLessonCompletion.course_id == course_id,
            UserLessonCompletion.completed == True,
        )
        .all()
    )
    active_map = {c.lesson_id: c.completed_at for c in active_completions}

    annotated = [
        {
            "id": l.id,
            "course_id": l.course_id,
            "title": l.title,
            "description": l.description,
            "order_index": l.order_index,
            "duration_minutes": l.duration_minutes,
            "is_completed": l.id in active_map,
            "completed_at": active_map.get(l.id),
        }
        for l in all_lessons
    ]

    return {
        "course_id": course_id,
        "total_lessons": total_lessons,
        "completed_lessons": completed_count,
        "progress_percent": progress_percent,
        "completed": is_completed,
        "lessons": annotated,
    }
