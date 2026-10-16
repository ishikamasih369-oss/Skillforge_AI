from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Course, DailyGoal, Internship, StudySession, User, UserCourse

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    enrollments = (
        db.query(UserCourse, Course)
        .join(Course, UserCourse.course_id == Course.id)
        .filter(UserCourse.user_id == current_user.id)
        .all()
    )

    internships = (
        db.query(Internship)
        .filter(Internship.user_id == current_user.id)
        .all()
    )

    total_courses = len(enrollments)
    completed_courses = sum(
        1 for enrollment, _ in enrollments
        if enrollment.completed
    )

    enrolled_courses_list = [
        {
            "course_id": course.id,
            "title": course.title,
            "category": course.category,
            "difficulty": course.difficulty,
            "progress": enrollment.progress,
            "completed": enrollment.completed,
        }
        for enrollment, course in enrollments
    ]

    internship_stats = {
        "total": len(internships),
        "Saved": 0,
        "Applied": 0,
        "Assessment": 0,
        "Interview": 0,
        "Rejected": 0,
        "Selected": 0
    }

    for internship in internships:
        if internship.status in internship_stats:
            internship_stats[internship.status] += 1

    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    end = start + timedelta(days=1)

    daily_goal = (
        db.query(DailyGoal)
        .filter(
            DailyGoal.user_id == current_user.id,
            DailyGoal.goal_date >= start,
            DailyGoal.goal_date < end
        )
        .first()
    )

    # Calculate real study session statistics
    all_sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == current_user.id)
        .order_by(StudySession.start_time.desc())
        .all()
    )

    completed_sessions = [s for s in all_sessions if not s.is_active]
    active_session_model = next((s for s in all_sessions if s.is_active), None)

    start_of_week = today - timedelta(days=7)
    today_seconds = 0
    week_seconds = 0
    study_dates: set[datetime.date] = set()

    for s in completed_sessions:
        s_date = s.start_time.date()
        dur = max(0, s.duration_seconds)
        if dur > 0:
            study_dates.add(s_date)
        if s_date == today:
            today_seconds += dur
        if s_date >= start_of_week:
            week_seconds += dur

    # Calculate current daily streak
    current_streak = 0
    if today in study_dates:
        check_date = today
    elif (today - timedelta(days=1)) in study_dates:
        check_date = today - timedelta(days=1)
    else:
        check_date = None

    if check_date:
        while check_date in study_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

    active_session_data = None
    if active_session_model:
        elapsed = active_session_model.duration_seconds
        if not active_session_model.is_paused and active_session_model.last_resumed_at:
            elapsed += max(0, int((datetime.utcnow() - active_session_model.last_resumed_at).total_seconds()))

        c_title = None
        if active_session_model.course_id:
            c = db.query(Course).filter(Course.id == active_session_model.course_id).first()
            if c:
                c_title = c.title

        active_session_data = {
            "id": active_session_model.id,
            "course_id": active_session_model.course_id,
            "course_title": c_title,
            "skill_name": active_session_model.skill_name,
            "start_time": active_session_model.start_time,
            "duration_seconds": active_session_model.duration_seconds,
            "current_elapsed_seconds": elapsed,
            "is_active": True,
            "is_paused": active_session_model.is_paused,
        }

    # Format recent 5 completed sessions
    course_map = {c.id: c.title for _, c in enrollments}
    recent_sessions_data = []
    for s in completed_sessions[:5]:
        title = course_map.get(s.course_id) if s.course_id else None
        if not title and s.course_id:
            c = db.query(Course).filter(Course.id == s.course_id).first()
            if c:
                title = c.title
        recent_sessions_data.append({
            "id": s.id,
            "course_id": s.course_id,
            "course_title": title,
            "skill_name": s.skill_name,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_seconds": s.duration_seconds,
        })

    return {
        "courses": {
            "enrolled": total_courses,
            "completed": completed_courses,
            "list": enrolled_courses_list,
        },
        "internships": internship_stats,
        "daily_goal": {
            "target_minutes": daily_goal.target_minutes if daily_goal else 0,
            "completed_minutes": daily_goal.completed_minutes if daily_goal else 0,
            "completed": daily_goal.completed if daily_goal else False
        },
        "study_stats": {
            "today_study_seconds": today_seconds,
            "week_study_seconds": week_seconds,
            "current_streak_days": current_streak,
            "total_sessions_count": len(completed_sessions),
        },
        "active_session": active_session_data,
        "recent_sessions": recent_sessions_data,
    }