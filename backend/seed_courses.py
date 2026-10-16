import logging
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import Course, CourseLesson

logger = logging.getLogger(__name__)

STARTER_COURSES = [
    {
        "title": "Python for Engineering & Systems",
        "description": (
            "Master foundational to intermediate Python programming, built-in data structures, "
            "object-oriented patterns, and standard library tools essential for software engineering roles."
        ),
        "category": "Python & Backend",
        "difficulty": "Beginner to Intermediate",
        "instructor": "Alex Rivera, Senior Systems Engineer",
        "duration_hours": 12,
        "image_url": None,
        "is_published": True,
        "lessons": [
            {
                "title": "Python Syntax, Variables & Control Structures",
                "description": "Understand core execution model, loops, conditionals, and idiomatic Python control flow.",
                "order_index": 1,
                "duration_minutes": 45,
            },
            {
                "title": "Data Structures: Lists, Dictionaries, Sets & Comprehensions",
                "description": "Efficient collection manipulation, dictionary hashing, and list comprehensions.",
                "order_index": 2,
                "duration_minutes": 60,
            },
            {
                "title": "Object-Oriented Programming & Reusable Classes",
                "description": "Encapsulation, inheritance, dunder methods, and domain modeling in Python.",
                "order_index": 3,
                "duration_minutes": 60,
            },
            {
                "title": "Working with Files, Virtual Environments & Packaging",
                "description": "Context managers, file I/O, pip dependencies, and virtual environment isolation.",
                "order_index": 4,
                "duration_minutes": 45,
            },
            {
                "title": "REST API Communication with httpx & JSON Parsing",
                "description": "Sending HTTP requests, parsing payloads, error handling, and timeout configurations.",
                "order_index": 5,
                "duration_minutes": 60,
            },
            {
                "title": "Unit Testing with pytest & Clean Code Practices",
                "description": "Writing test fixtures, assertions, parameterized tests, and ensuring reliability.",
                "order_index": 6,
                "duration_minutes": 60,
            },
        ],
    },
    {
        "title": "Full-Stack Web Development with React & FastAPI",
        "description": (
            "Build production-grade, resilient web applications with a modern Next.js/React frontend, "
            "FastAPI REST backend, PostgreSQL relational database, and secure JWT authentication."
        ),
        "category": "Full-Stack Development",
        "difficulty": "Intermediate",
        "instructor": "Elena Chen, Full-Stack Tech Lead",
        "duration_hours": 16,
        "image_url": None,
        "is_published": True,
        "lessons": [
            {
                "title": "Next.js App Router & Component Architecture",
                "description": "Server and client components, file-system routing, layouts, and page structuring.",
                "order_index": 1,
                "duration_minutes": 60,
            },
            {
                "title": "State Management, Context & Custom React Hooks",
                "description": "Managing authentication state, token storage, and reusable component hooks.",
                "order_index": 2,
                "duration_minutes": 60,
            },
            {
                "title": "RESTful API Architecture with FastAPI & Pydantic",
                "description": "Type validation, request parsing, response schemas, and dependency injection.",
                "order_index": 3,
                "duration_minutes": 60,
            },
            {
                "title": "Relational Data Modeling with PostgreSQL & SQLAlchemy",
                "description": "Designing relational tables, indexes, sessions, and performing safe query operations.",
                "order_index": 4,
                "duration_minutes": 75,
            },
            {
                "title": "JWT Authentication, Bearer Tokens & Route Protection",
                "description": "Password hashing with passlib/argon2, token generation, and secure route guards.",
                "order_index": 5,
                "duration_minutes": 60,
            },
            {
                "title": "Cloud Deployment, CORS & Environment Configuration",
                "description": "Deploying frontend to Vercel, backend to Render, Neon database connections, and CORS.",
                "order_index": 6,
                "duration_minutes": 60,
            },
        ],
    },
    {
        "title": "Data Structures & Algorithms for Technical Interviews",
        "description": (
            "Comprehensive preparation for technical interview coding rounds. "
            "Master algorithmic patterns, asymptotic complexity analysis, and structured problem-solving."
        ),
        "category": "Algorithms & Interview Prep",
        "difficulty": "Intermediate to Advanced",
        "instructor": "Marcus Vance, Algorithmic Specialist",
        "duration_hours": 20,
        "image_url": None,
        "is_published": True,
        "lessons": [
            {
                "title": "Time & Space Complexity (Big-O Analysis)",
                "description": "Evaluating worst-case complexity, memory overhead, and optimizing bottlenecks.",
                "order_index": 1,
                "duration_minutes": 45,
            },
            {
                "title": "Array Patterns: Two Pointers & Sliding Window",
                "description": "Solving subarray problems, two-pointer convergence, and range optimization.",
                "order_index": 2,
                "duration_minutes": 75,
            },
            {
                "title": "Hash Tables, Stacks & Queues",
                "description": "Fast lookups, monotonic stack patterns, BFS queues, and parenthetical matching.",
                "order_index": 3,
                "duration_minutes": 60,
            },
            {
                "title": "Linked Lists & Recursion Foundations",
                "description": "In-place list reversal, cycle detection (Floyd's algorithm), and recursive calls.",
                "order_index": 4,
                "duration_minutes": 60,
            },
            {
                "title": "Binary Trees & Tree Traversals (BFS / DFS)",
                "description": "Pre-order, in-order, post-order, level-order traversals, and BST property validation.",
                "order_index": 5,
                "duration_minutes": 90,
            },
            {
                "title": "Graph Algorithms: Adjacency Lists, BFS & DFS",
                "description": "Connected components, cycle detection, topological sorting, and shortest paths.",
                "order_index": 6,
                "duration_minutes": 90,
            },
            {
                "title": "Dynamic Programming: Memoization & Tabulation",
                "description": "Overlapping subproblems, optimal substructure, and state transition equations.",
                "order_index": 7,
                "duration_minutes": 90,
            },
        ],
    },
]


def seed_starter_courses(db: Session) -> list[Course]:
    """Idempotently seeds curated starter courses and their lessons.

    Never creates duplicates if courses or lessons already exist.
    """
    Base.metadata.create_all(bind=engine)
    created_or_found_courses = []

    for course_info in STARTER_COURSES:
        lessons_data = course_info.get("lessons", [])

        # Find existing course or create
        existing_course = (
            db.query(Course)
            .filter(Course.title == course_info["title"])
            .first()
        )

        if not existing_course:
            existing_course = Course(
                title=course_info["title"],
                description=course_info["description"],
                category=course_info["category"],
                difficulty=course_info["difficulty"],
                instructor=course_info["instructor"],
                duration_hours=course_info["duration_hours"],
                image_url=course_info["image_url"],
                is_published=course_info["is_published"],
            )
            db.add(existing_course)
            db.commit()
            db.refresh(existing_course)
            logger.info("Created starter course: '%s'", existing_course.title)

        created_or_found_courses.append(existing_course)

        # Seed lessons idempotently
        for lesson_data in lessons_data:
            existing_lesson = (
                db.query(CourseLesson)
                .filter(
                    CourseLesson.course_id == existing_course.id,
                    CourseLesson.title == lesson_data["title"],
                )
                .first()
            )

            if not existing_lesson:
                new_lesson = CourseLesson(
                    course_id=existing_course.id,
                    title=lesson_data["title"],
                    description=lesson_data["description"],
                    order_index=lesson_data["order_index"],
                    duration_minutes=lesson_data["duration_minutes"],
                )
                db.add(new_lesson)
                logger.info("Added lesson '%s' to course '%s'", lesson_data["title"], existing_course.title)

        db.commit()

    return created_or_found_courses


if __name__ == "__main__":
    db = SessionLocal()
    try:
        courses = seed_starter_courses(db)
        print(f"Successfully ensured {len(courses)} starter courses in database catalog.")
    finally:
        db.close()
