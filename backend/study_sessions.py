from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import Course, DailyGoal, StudySession, User
from schemas import (
    StudySessionResponse,
    StudySessionStartRequest,
    StudySessionUpdateRequest,
    StudyStatsResponse,
)

router = APIRouter(prefix="/api/study-sessions", tags=["Study Sessions"])


def _format_session_response(session: StudySession, db: Session) -> dict[str, Any]:
    """Helper to compute accurate elapsed time and attach optional course title."""
    current_elapsed = session.duration_seconds
    if session.is_active and not session.is_paused and session.last_resumed_at:
        additional = max(0, int((datetime.utcnow() - session.last_resumed_at).total_seconds()))
        current_elapsed += additional

    course_title = None
    if session.course_id:
        course = db.query(Course).filter(Course.id == session.course_id).first()
        if course:
            course_title = course.title

    return {
        "id": session.id,
        "user_id": session.user_id,
        "course_id": session.course_id,
        "course_title": course_title,
        "skill_name": session.skill_name,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "duration_seconds": session.duration_seconds,
        "is_active": session.is_active,
        "is_paused": session.is_paused,
        "current_elapsed_seconds": current_elapsed,
        "created_at": session.created_at,
    }


@router.get("/active", response_model=StudySessionResponse | None)
def get_active_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the current user's active timer session, computing exact elapsed seconds from persisted timestamps."""
    active_session = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == current_user.id,
            StudySession.is_active == True,
        )
        .first()
    )

    if not active_session:
        return None

    return _format_session_response(active_session, db)


@router.post("/start", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
def start_study_session(
    payload: StudySessionStartRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a new study session. Prevents simultaneous active sessions and duplicate clicks."""
    existing_active = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == current_user.id,
            StudySession.is_active == True,
        )
        .first()
    )

    if existing_active:
        # If user clicked repeatedly for the same course and skill, return the already running session idempotently
        if (
            existing_active.course_id == payload.course_id
            and existing_active.skill_name.lower() == payload.skill_name.strip().lower()
        ):
            response.status_code = status.HTTP_200_OK
            return _format_session_response(existing_active, db)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active study session in progress. Please pause or stop it before starting another.",
        )

    # Optional course validation
    if payload.course_id:
        course = db.query(Course).filter(Course.id == payload.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected course not found",
            )

    now = datetime.utcnow()
    new_session = StudySession(
        user_id=current_user.id,
        course_id=payload.course_id,
        skill_name=payload.skill_name.strip(),
        start_time=now,
        end_time=None,
        duration_seconds=0,
        is_active=True,
        is_paused=False,
        last_resumed_at=now,
        created_at=now,
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return _format_session_response(new_session, db)


@router.post("/{session_id}/pause", response_model=StudySessionResponse)
def pause_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pause an active study session, persisting accumulated elapsed time."""
    session = (
        db.query(StudySession)
        .filter(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        )

    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot pause an inactive or completed session",
        )

    if not session.is_paused and session.last_resumed_at:
        additional = max(0, int((datetime.utcnow() - session.last_resumed_at).total_seconds()))
        session.duration_seconds += additional
        session.is_paused = True
        session.last_resumed_at = None
        db.commit()
        db.refresh(session)

    return _format_session_response(session, db)


@router.post("/{session_id}/resume", response_model=StudySessionResponse)
def resume_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resume a paused study session."""
    session = (
        db.query(StudySession)
        .filter(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        )

    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot resume an inactive or completed session",
        )

    if session.is_paused:
        session.is_paused = False
        session.last_resumed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)

    return _format_session_response(session, db)


@router.post("/{session_id}/stop", response_model=StudySessionResponse)
def stop_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stop and complete a study session, persisting total duration and updating daily goals."""
    session = (
        db.query(StudySession)
        .filter(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        )

    if not session.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Study session is already stopped",
        )

    now = datetime.utcnow()
    if not session.is_paused and session.last_resumed_at:
        additional = max(0, int((now - session.last_resumed_at).total_seconds()))
        session.duration_seconds += additional

    session.duration_seconds = max(0, session.duration_seconds)
    session.is_active = False
    session.is_paused = False
    session.last_resumed_at = None
    session.end_time = now

    # Optionally synchronize with today's daily goal progress
    minutes_studied = session.duration_seconds // 60
    if minutes_studied > 0:
        today = now.date()
        start = datetime.combine(today, datetime.min.time())
        end = datetime.combine(today, datetime.max.time())
        goal = (
            db.query(DailyGoal)
            .filter(
                DailyGoal.user_id == current_user.id,
                DailyGoal.goal_date >= start,
                DailyGoal.goal_date < end,
            )
            .first()
        )
        if goal:
            goal.completed_minutes += minutes_studied
            if goal.completed_minutes >= goal.target_minutes:
                goal.completed = True

    db.commit()
    db.refresh(session)

    return _format_session_response(session, db)


@router.get("/", response_model=list[StudySessionResponse])
def get_study_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all completed study sessions for the authenticated user."""
    sessions = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == current_user.id,
            StudySession.is_active == False,
        )
        .order_by(StudySession.start_time.desc())
        .all()
    )

    return [_format_session_response(s, db) for s in sessions]


@router.put("/{session_id}", response_model=StudySessionResponse)
def update_study_session(
    session_id: int,
    payload: StudySessionUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow user to safely correct an incorrectly recorded session duration or skill name."""
    session = (
        db.query(StudySession)
        .filter(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        )

    if payload.duration_seconds < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Duration cannot be negative",
        )

    session.duration_seconds = payload.duration_seconds
    if payload.skill_name and payload.skill_name.strip():
        session.skill_name = payload.skill_name.strip()

    db.commit()
    db.refresh(session)

    return _format_session_response(session, db)


@router.delete("/{session_id}")
def delete_study_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Safely delete a study session belonging to the authenticated user."""
    session = (
        db.query(StudySession)
        .filter(
            StudySession.id == session_id,
            StudySession.user_id == current_user.id,
        )
        .first()
    )

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study session not found",
        )

    db.delete(session)
    db.commit()

    return {"message": "Study session deleted successfully", "id": session_id}


@router.get("/stats", response_model=StudyStatsResponse)
def get_study_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Calculate aggregated study statistics and actual daily streaks from completed sessions."""
    completed_sessions = (
        db.query(StudySession)
        .filter(
            StudySession.user_id == current_user.id,
            StudySession.is_active == False,
        )
        .order_by(StudySession.start_time.desc())
        .all()
    )

    now = datetime.utcnow()
    today_date = now.date()
    start_of_week = today_date - timedelta(days=7)

    today_seconds = 0
    week_seconds = 0
    study_dates: set[datetime.date] = set()

    for s in completed_sessions:
        session_date = s.start_time.date()
        duration = max(0, s.duration_seconds)

        if duration > 0:
            study_dates.add(session_date)

        if session_date == today_date:
            today_seconds += duration

        if session_date >= start_of_week:
            week_seconds += duration

    # Calculate actual consecutive study streak
    current_streak = 0
    if today_date in study_dates:
        check_date = today_date
    elif (today_date - timedelta(days=1)) in study_dates:
        check_date = today_date - timedelta(days=1)
    else:
        check_date = None

    if check_date:
        while check_date in study_dates:
            current_streak += 1
            check_date -= timedelta(days=1)

    formatted_recent = [_format_session_response(s, db) for s in completed_sessions[:5]]

    return {
        "today_study_seconds": today_seconds,
        "week_study_seconds": week_seconds,
        "current_streak_days": current_streak,
        "total_sessions_count": len(completed_sessions),
        "recent_sessions": formatted_recent,
    }
