from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Course, DailyGoal, Internship, User, UserCourse

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
        db.query(UserCourse)
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
        1 for enrollment in enrollments
        if enrollment.completed
    )

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

    return {
        "courses": {
            "enrolled": total_courses,
            "completed": completed_courses
        },
        "internships": internship_stats,
        "daily_goal": {
            "target_minutes": daily_goal.target_minutes if daily_goal else 0,
            "completed_minutes": daily_goal.completed_minutes if daily_goal else 0,
            "completed": daily_goal.completed if daily_goal else False
        }
    }