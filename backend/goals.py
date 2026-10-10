from datetime import datetime,timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import DailyGoal, User
from schemas import DailyGoalCreate,GoalProgressUpdate


router = APIRouter(
    prefix="/api/goals",
    tags=["Daily Goals"]
)


@router.post("/")
def create_daily_goal(
    goal_data: DailyGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()

    existing_goal = (
        db.query(DailyGoal)
        .filter(
            DailyGoal.user_id == current_user.id,
            DailyGoal.goal_date >= datetime.combine(today, datetime.min.time()),
            DailyGoal.goal_date < datetime.combine(today, datetime.max.time())
        )
        .first()
    )

    if existing_goal:
        raise HTTPException(
            status_code=400,
            detail="Daily goal already exists for today"
        )

    goal = DailyGoal(
        user_id=current_user.id,
        goal_date=datetime.utcnow(),
        target_minutes=goal_data.target_minutes,
        completed_minutes=0,
        completed=False
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    return {
        "message": "Daily goal created successfully",
        "goal_id": goal.id,
        "target_minutes": goal.target_minutes,
        "completed_minutes": goal.completed_minutes,
        "completed": goal.completed
    }
@router.put("/progress")
def update_goal_progress(
    progress_data: GoalProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()

    goal = (
        db.query(DailyGoal)
        .filter(
            DailyGoal.user_id == current_user.id,
            DailyGoal.goal_date >= datetime.combine(
                today,
                datetime.min.time()
            ),
            DailyGoal.goal_date < datetime.combine(
                today,
                datetime.max.time()
            )
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="No daily goal found for today"
        )

    if progress_data.completed_minutes > goal.target_minutes:
        raise HTTPException(
            status_code=400,
            detail="Completed minutes cannot exceed target minutes"
        )

    goal.completed_minutes = progress_data.completed_minutes

    if goal.completed_minutes >= goal.target_minutes:
        goal.completed = True
    else:
        goal.completed = False

    db.commit()
    db.refresh(goal)

    return {
        "message": "Daily goal progress updated successfully",
        "goal_id": goal.id,
        "target_minutes": goal.target_minutes,
        "completed_minutes": goal.completed_minutes,
        "completed": goal.completed
    }
@router.get("/today")
def get_today_goal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = datetime.utcnow().date()

    goal = (
        db.query(DailyGoal)
        .filter(
            DailyGoal.user_id == current_user.id,
            DailyGoal.goal_date >= datetime.combine(
                today,
                datetime.min.time()
            ),
            DailyGoal.goal_date < datetime.combine(
                today,
                datetime.max.time()
            )
        )
        .first()
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="No daily goal found for today"
        )

    return {
        "goal_id": goal.id,
        "target_minutes": goal.target_minutes,
        "completed_minutes": goal.completed_minutes,
        "completed": goal.completed
    }
@router.get("/streak")
def get_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = (
        db.query(DailyGoal)
        .filter(
            DailyGoal.user_id == current_user.id,
            DailyGoal.completed == True
        )
        .order_by(DailyGoal.goal_date.asc())
        .all()
    )

    if not goals:
        return {
            "current_streak": 0,
            "longest_streak": 0
        }

    completed_dates = {
        goal.goal_date.date()
        for goal in goals
    }

    sorted_dates = sorted(completed_dates)

    # Calculate longest streak
    longest_streak = 1
    current_sequence = 1

    for i in range(1, len(sorted_dates)):
        difference = sorted_dates[i] - sorted_dates[i - 1]

        if difference == timedelta(days=1):
            current_sequence += 1
        else:
            current_sequence = 1

        longest_streak = max(
            longest_streak,
            current_sequence
        )

    # Calculate current streak
    today = datetime.utcnow().date()

    if today in completed_dates:
        current_date = today
    elif today - timedelta(days=1) in completed_dates:
        current_date = today - timedelta(days=1)
    else:
        return {
            "current_streak": 0,
            "longest_streak": longest_streak
        }

    current_streak = 0

    while current_date in completed_dates:
        current_streak += 1
        current_date -= timedelta(days=1)

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak
    }
@router.get("/history")
def get_goal_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goals = (
        db.query(DailyGoal)
        .filter(DailyGoal.user_id == current_user.id)
        .order_by(DailyGoal.goal_date.desc())
        .all()
    )

    return [
        {
            "goal_id": goal.id,
            "date": goal.goal_date.date(),
            "target_minutes": goal.target_minutes,
            "completed_minutes": goal.completed_minutes,
            "completed": goal.completed
        }
        for goal in goals
    ]