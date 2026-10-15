from fastapi.testclient import TestClient
from database import SessionLocal
from models import Course, DailyGoal, Internship, Note, UserCourse, User
from main import app


def test_root_endpoint():
    with TestClient(app) as test_client:
        res = test_client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert "running" in data["message"].lower()


def test_health_check_endpoint():
    with TestClient(app) as test_client:
        res = test_client.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["service"] == "SkillForge AI"


def test_database_test_endpoint():
    with TestClient(app) as test_client:
        res = test_client.get("/api/database-test")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert data["database"] == "PostgreSQL"


def test_protected_routes_require_auth():
    with TestClient(app) as test_client:
        endpoints = [
            "/api/auth/me",
            "/api/courses/my-courses",
            "/api/goals/today",
            "/api/goals/streak",
            "/api/goals/history",
            "/api/internships/",
            "/api/internships/stats",
            "/api/notes/",
            "/api/dashboard/summary",
        ]
        for ep in endpoints:
            res = test_client.get(ep)
            assert res.status_code in (401, 403), f"Endpoint {ep} should be protected but returned {res.status_code}"


def test_auth_login_validation_and_invalid_credentials():
    with TestClient(app) as test_client:
        # 1. Validation error on missing fields
        res = test_client.post("/api/auth/login", json={})
        assert res.status_code == 422

        # 2. Validation error on bad email
        res = test_client.post("/api/auth/login", json={"email": "not-an-email", "password": "pass"})
        assert res.status_code == 422

        # 3. 401 on non-existent user
        res = test_client.post(
            "/api/auth/login",
            json={"email": "nonexistent.user.test@example.com", "password": "wrongpassword123"}
        )
        assert res.status_code == 401
        assert "invalid email or password" in res.json()["detail"].lower()


def test_auth_registration_and_login_lifecycle():
    test_email = "auth.lifecycle.regression@example.com"
    test_password = "SecurePassword123"
    test_name = "Regression Lifecycle User"

    # Ensure clean state before running
    db = SessionLocal()
    db.query(User).filter(User.email == test_email).delete()
    db.commit()
    db.close()

    try:
        with TestClient(app) as test_client:
            # 1. Register successfully
            register_payload = {
                "name": test_name,
                "email": test_email,
                "password": test_password
            }
            reg_res = test_client.post("/api/auth/register", json=register_payload)
            assert reg_res.status_code == 201
            reg_data = reg_res.json()
            assert reg_data["email"] == test_email
            assert reg_data["name"] == test_name
            assert "id" in reg_data
            user_id = reg_data["id"]

            # 2. Login with correct credentials
            login_payload = {
                "email": test_email,
                "password": test_password
            }
            login_res = test_client.post("/api/auth/login", json=login_payload)
            assert login_res.status_code == 200
            login_data = login_res.json()
            assert "access_token" in login_data
            assert isinstance(login_data["access_token"], str) and len(login_data["access_token"]) > 0
            assert login_data["token_type"].lower() == "bearer"
            assert "user" in login_data
            assert login_data["user"]["id"] == user_id
            assert login_data["user"]["email"] == test_email
            assert login_data["user"]["name"] == test_name

            # 3. Login with incorrect password
            bad_login_payload = {
                "email": test_email,
                "password": "IncorrectPassword999"
            }
            bad_res = test_client.post("/api/auth/login", json=bad_login_payload)
            assert bad_res.status_code == 401
            bad_data = bad_res.json()
            assert "detail" in bad_data
            assert "invalid email or password" in bad_data["detail"].lower()
    finally:
        # Safe cleanup after test completion
        clean_db = SessionLocal()
        clean_db.query(User).filter(User.email == test_email).delete()
        clean_db.commit()
        clean_db.close()


def test_auth_me_endpoint(client, mock_user):
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == mock_user.id
    assert data["email"] == mock_user.email
    assert data["name"] == mock_user.name


def test_courses_listing_and_my_courses(client):
    # Public listing
    res = client.get("/api/courses/")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # Authenticated my-courses
    res = client.get("/api/courses/my-courses")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_course_enrollment_and_progress_lifecycle(client, mock_user):
    db = SessionLocal()
    # Find or use an existing course
    course = db.query(Course).first()
    if not course:
        db.close()
        return

    course_id = course.id
    # Clean any existing enrollment for mock_user on this course before test
    db.query(UserCourse).filter(
        UserCourse.user_id == mock_user.id,
        UserCourse.course_id == course_id
    ).delete()
    db.commit()
    db.close()

    try:
        # Enroll
        res = client.post(f"/api/courses/{course_id}/enroll")
        assert res.status_code == 200
        assert res.json()["progress"] == 0

        # Duplicate enrollment should return 400
        dup_res = client.post(f"/api/courses/{course_id}/enroll")
        assert dup_res.status_code == 400

        # Update progress to 75%
        prog_res = client.put(f"/api/courses/{course_id}/progress", json={"progress": 75})
        assert prog_res.status_code == 200
        assert prog_res.json()["progress"] == 75
        assert prog_res.json()["completed"] is False

        # Update progress to 100% -> completed should become True
        comp_res = client.put(f"/api/courses/{course_id}/progress", json={"progress": 100})
        assert comp_res.status_code == 200
        assert comp_res.json()["completed"] is True
    finally:
        # Cleanup test enrollment safely
        clean_db = SessionLocal()
        clean_db.query(UserCourse).filter(
            UserCourse.user_id == mock_user.id,
            UserCourse.course_id == course_id
        ).delete()
        clean_db.commit()
        clean_db.close()


def test_goals_endpoints(client):
    # Get today's goal (returns 200 with object or null)
    res = client.get("/api/goals/today")
    assert res.status_code in (200, 404)

    # Get streak
    streak_res = client.get("/api/goals/streak")
    assert streak_res.status_code == 200
    assert "current_streak" in streak_res.json()

    # Get history
    hist_res = client.get("/api/goals/history")
    assert hist_res.status_code == 200
    assert isinstance(hist_res.json(), list)


def test_internships_crud_lifecycle(client, mock_user):
    # 1. Create a test internship
    payload = {
        "company": "RegressionTest Corp",
        "role": "QA Engineer Intern",
        "location": "Remote",
        "status": "Saved",
        "notes": "Safe test record"
    }
    create_res = client.post("/api/internships/", json=payload)
    assert create_res.status_code == 200
    internship_id = create_res.json()["id"]

    try:
        # 2. Get list and verify presence
        list_res = client.get("/api/internships/")
        assert list_res.status_code == 200
        ids = [item["id"] for item in list_res.json()]
        assert internship_id in ids

        # 3. Update status
        patch_res = client.patch(
            f"/api/internships/{internship_id}/status",
            json={"status": "Applied"}
        )
        assert patch_res.status_code == 200

        # 4. Check stats
        stats_res = client.get("/api/internships/stats")
        assert stats_res.status_code == 200
        assert "Applied" in stats_res.json()
    finally:
        # 5. Safe cleanup via DELETE endpoint
        del_res = client.delete(f"/api/internships/{internship_id}")
        assert del_res.status_code == 200


def test_notes_crud_lifecycle(client):
    # 1. Create test note
    payload = {
        "title": "Regression Test Note",
        "content": "Verifying note creation and safe deletion.",
        "category": "Testing"
    }
    create_res = client.post("/api/notes/", json=payload)
    assert create_res.status_code == 201
    note_id = create_res.json()["id"]

    try:
        # 2. Get notes
        list_res = client.get("/api/notes/")
        assert list_res.status_code == 200
        note_ids = [n["id"] for n in list_res.json()]
        assert note_id in note_ids

        # 3. Update note
        update_res = client.put(
            f"/api/notes/{note_id}",
            json={
                "title": "Updated Regression Test Note",
                "content": "Updated content successfully verified.",
                "category": "Testing"
            }
        )
        assert update_res.status_code == 200
        assert update_res.json()["title"] == "Updated Regression Test Note"
    finally:
        # 4. Cleanup via DELETE
        del_res = client.delete(f"/api/notes/{note_id}")
        assert del_res.status_code == 200


def test_dashboard_summary_endpoint(client):
    res = client.get("/api/dashboard/summary")
    assert res.status_code == 200
    data = res.json()
    assert "courses" in data
    assert "internships" in data
    assert "daily_goal" in data
