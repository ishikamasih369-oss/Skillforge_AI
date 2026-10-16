from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from auth import create_access_token, get_current_user
from database import SessionLocal
from main import app
from models import Course, CourseLesson, StudySession, User, UserCourse, UserLessonCompletion


@pytest.fixture
def test_user_a():
    db = SessionLocal()
    email = "test.user.a@skillforge.test"
    db.query(User).filter(User.email == email).delete()
    db.commit()

    user = User(
        name="Candidate Alpha",
        email=email,
        password_hash="mock_hash_a",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    yield user

    clean_db = SessionLocal()
    clean_db.query(StudySession).filter(StudySession.user_id == user.id).delete()
    clean_db.query(UserLessonCompletion).filter(UserLessonCompletion.user_id == user.id).delete()
    clean_db.query(UserCourse).filter(UserCourse.user_id == user.id).delete()
    clean_db.query(User).filter(User.id == user.id).delete()
    clean_db.commit()
    clean_db.close()


@pytest.fixture
def test_user_b():
    db = SessionLocal()
    email = "test.user.b@skillforge.test"
    db.query(User).filter(User.email == email).delete()
    db.commit()

    user = User(
        name="Candidate Beta",
        email=email,
        password_hash="mock_hash_b",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    db.close()

    yield user

    clean_db = SessionLocal()
    clean_db.query(StudySession).filter(StudySession.user_id == user.id).delete()
    clean_db.query(UserLessonCompletion).filter(UserLessonCompletion.user_id == user.id).delete()
    clean_db.query(UserCourse).filter(UserCourse.user_id == user.id).delete()
    clean_db.query(User).filter(User.id == user.id).delete()
    clean_db.commit()
    clean_db.close()


def make_client_for(user):
    app.dependency_overrides[get_current_user] = lambda: user
    client = TestClient(app)
    return client


def test_start_pause_resume_stop_study_session(test_user_a):
    with make_client_for(test_user_a) as client:
        # 1. Start study session
        start_res = client.post(
            "/api/study-sessions/start",
            json={"skill_name": "Python Systems & Concurrency", "course_id": None},
        )
        assert start_res.status_code == 201
        session = start_res.json()
        assert session["is_active"] is True
        assert session["is_paused"] is False
        assert session["skill_name"] == "Python Systems & Concurrency"
        session_id = session["id"]

        # 2. Pause session
        pause_res = client.post(f"/api/study-sessions/{session_id}/pause")
        assert pause_res.status_code == 200
        paused_data = pause_res.json()
        assert paused_data["is_paused"] is True
        assert paused_data["is_active"] is True

        # 3. Resume session
        resume_res = client.post(f"/api/study-sessions/{session_id}/resume")
        assert resume_res.status_code == 200
        resumed_data = resume_res.json()
        assert resumed_data["is_paused"] is False
        assert resumed_data["is_active"] is True

        # 4. Stop session
        stop_res = client.post(f"/api/study-sessions/{session_id}/stop")
        assert stop_res.status_code == 200
        stopped_data = stop_res.json()
        assert stopped_data["is_active"] is False
        assert stopped_data["is_paused"] is False
        assert stopped_data["duration_seconds"] >= 0
        assert stopped_data["end_time"] is not None

    app.dependency_overrides.clear()


def test_active_study_session_recovery_and_elapsed(test_user_a):
    with make_client_for(test_user_a) as client:
        # Start a session
        start_res = client.post(
            "/api/study-sessions/start",
            json={"skill_name": "PostgreSQL Optimization", "course_id": None},
        )
        assert start_res.status_code == 201
        session_id = start_res.json()["id"]

        # Page refresh simulation: calling active endpoint
        active_res = client.get("/api/study-sessions/active")
        assert active_res.status_code == 200
        active_data = active_res.json()
        assert active_data is not None
        assert active_data["id"] == session_id
        assert active_data["is_active"] is True
        assert "current_elapsed_seconds" in active_data

        # Stop session
        client.post(f"/api/study-sessions/{session_id}/stop")

        # Now active session should be null
        after_stop_res = client.get("/api/study-sessions/active")
        assert after_stop_res.status_code == 200
        assert after_stop_res.json() is None

    app.dependency_overrides.clear()


def test_prevent_duplicate_and_simultaneous_active_sessions(test_user_a):
    with make_client_for(test_user_a) as client:
        payload = {"skill_name": "Docker & Microservices", "course_id": None}
        first_res = client.post("/api/study-sessions/start", json=payload)
        assert first_res.status_code == 201
        first_id = first_res.json()["id"]

        # Clicking start again with same skill should return the existing active session
        dup_res = client.post("/api/study-sessions/start", json=payload)
        assert dup_res.status_code == 200
        assert dup_res.json()["id"] == first_id

        # Attempting to start a different skill while one is active should be rejected with 400
        diff_payload = {"skill_name": "Different Skill", "course_id": None}
        diff_res = client.post("/api/study-sessions/start", json=diff_payload)
        assert diff_res.status_code == 400
        assert "already have an active study session" in diff_res.json()["detail"].lower()

        # Stop the session to clean up
        client.post(f"/api/study-sessions/{first_id}/stop")

    app.dependency_overrides.clear()


def test_study_session_user_isolation_and_authorization(test_user_a, test_user_b):
    with make_client_for(test_user_a) as client_a:
        res_a = client_a.post(
            "/api/study-sessions/start",
            json={"skill_name": "User A Private Study", "course_id": None},
        )
        assert res_a.status_code == 201
        session_a_id = res_a.json()["id"]

    app.dependency_overrides.clear()

    # User B should NOT be able to pause, resume, stop, edit, or delete User A's session
    with make_client_for(test_user_b) as client_b:
        pause_try = client_b.post(f"/api/study-sessions/{session_a_id}/pause")
        assert pause_try.status_code == 404

        stop_try = client_b.post(f"/api/study-sessions/{session_a_id}/stop")
        assert stop_try.status_code == 404

        edit_try = client_b.put(
            f"/api/study-sessions/{session_a_id}",
            json={"duration_seconds": 999},
        )
        assert edit_try.status_code == 404

        del_try = client_b.delete(f"/api/study-sessions/{session_a_id}")
        assert del_try.status_code == 404

        # User B's session list must not contain User A's session
        list_b = client_b.get("/api/study-sessions/")
        assert list_b.status_code == 200
        b_ids = [s["id"] for s in list_b.json()]
        assert session_a_id not in b_ids

    app.dependency_overrides.clear()

    # Clean up User A's session
    with make_client_for(test_user_a) as client_a:
        client_a.post(f"/api/study-sessions/{session_a_id}/stop")

    app.dependency_overrides.clear()


def test_study_session_update_and_delete(test_user_a):
    with make_client_for(test_user_a) as client:
        start_res = client.post(
            "/api/study-sessions/start",
            json={"skill_name": "Algorithms Practice", "course_id": None},
        )
        session_id = start_res.json()["id"]
        client.post(f"/api/study-sessions/{session_id}/stop")

        # Edit duration and skill name
        update_res = client.put(
            f"/api/study-sessions/{session_id}",
            json={"duration_seconds": 1800, "skill_name": "Tree Traversals Deep Dive"},
        )
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["duration_seconds"] == 1800
        assert updated["skill_name"] == "Tree Traversals Deep Dive"

        # Negative duration rejected
        neg_res = client.put(
            f"/api/study-sessions/{session_id}",
            json={"duration_seconds": -50},
        )
        assert neg_res.status_code == 422 or neg_res.status_code == 400

        # Delete session
        del_res = client.delete(f"/api/study-sessions/{session_id}")
        assert del_res.status_code == 200

        # Verify gone
        get_res = client.get("/api/study-sessions/")
        assert all(s["id"] != session_id for s in get_res.json())

    app.dependency_overrides.clear()


def test_course_lessons_and_progress_calculation(test_user_a):
    db = SessionLocal()
    # Find a starter course with lessons
    course = (
        db.query(Course)
        .join(CourseLesson, Course.id == CourseLesson.course_id)
        .first()
    )
    assert course is not None, "Starter courses must be seeded"
    course_id = course.id
    db.close()

    with make_client_for(test_user_a) as client:
        # Get lessons
        lessons_res = client.get(f"/api/courses/{course_id}/lessons")
        assert lessons_res.status_code == 200
        data = lessons_res.json()
        assert data["total_lessons"] > 0
        assert data["completed_lessons"] == 0
        assert data["progress_percent"] == 0
        first_lesson_id = data["lessons"][0]["id"]

        # Toggle first lesson complete
        toggle_res = client.post(f"/api/courses/{course_id}/lessons/{first_lesson_id}/toggle")
        assert toggle_res.status_code == 200
        toggle_data = toggle_res.json()
        assert toggle_data["completed_lessons"] == 1
        assert toggle_data["progress_percent"] > 0
        assert toggle_data["lessons"][0]["is_completed"] is True

        # Toggle first lesson again -> uncompletes it
        toggle_off_res = client.post(f"/api/courses/{course_id}/lessons/{first_lesson_id}/toggle")
        assert toggle_off_res.status_code == 200
        off_data = toggle_off_res.json()
        assert off_data["completed_lessons"] == 0
        assert off_data["progress_percent"] == 0
        assert off_data["lessons"][0]["is_completed"] is False

    app.dependency_overrides.clear()


def test_dashboard_summary_includes_real_study_stats(test_user_a):
    with make_client_for(test_user_a) as client:
        res = client.get("/api/dashboard/summary")
        assert res.status_code == 200
        data = res.json()
        assert "study_stats" in data
        assert "today_study_seconds" in data["study_stats"]
        assert "week_study_seconds" in data["study_stats"]
        assert "current_streak_days" in data["study_stats"]
        assert "recent_sessions" in data
        assert "courses" in data
        assert "internships" in data
        assert "daily_goal" in data

    app.dependency_overrides.clear()
