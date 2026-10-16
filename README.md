# SkillForge AI

> **An AI-powered learning and career acceleration platform designed for computer science students and technical candidates preparing for competitive software engineering internships.**

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
  - [Candidate Cockpit (Dashboard)](#1-candidate-cockpit-dashboard)
  - [Automatic Study-Time Tracking & Deep Work Timer](#2-automatic-study-time-tracking--deep-work-timer)
  - [Curriculum Milestones & Course Management](#3-curriculum-milestones--course-management)
  - [Internship Application Pipeline Tracker](#4-internship-application-pipeline-tracker)
  - [Technical Notes & Revision Workspace](#5-technical-notes--revision-workspace)
  - [AI Career Assistance Tools](#6-ai-career-assistance-tools)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local Setup & Installation](#local-setup--installation)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup (FastAPI & PostgreSQL)](#2-backend-setup-fastapi--postgresql)
  - [3. Frontend Setup (Next.js & Tailwind CSS)](#3-frontend-setup-nextjs--tailwind-css)
  - [4. Optional: Local AI Engine (Ollama)](#4-optional-local-ai-engine-ollama)
- [Environment Variables](#environment-variables)
- [Database Setup & Seeding](#database-setup--seeding)
- [API Overview & Interactive Documentation](#api-overview--interactive-documentation)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment](#production-deployment)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Security & Privacy](#security--privacy)
- [Contributing & License](#contributing--license)

---

## Overview

Securing a software engineering internship requires balancing continuous coursework, coding practice, technical interview preparation, and dozens of job applications. Most students rely on fragmented tools—spreadsheets for applications, arbitrary phone timers for study sessions, and disconnected course portals.

**SkillForge AI** consolidates this entire workflow into a single, cohesive candidate cockpit:
- **Tracks deep work study time** with an accurate, server-persisted study timer that recovers seamlessly across page refreshes.
- **Measures learning velocity** through structured, milestone-driven course syllabi separate from raw time logged.
- **Maintains daily momentum** with automated study streak calculations and daily goal synchronization.
- **Organizes the hiring pipeline** with a dedicated internship Kanban tracker.
- **Accelerates preparation** with local AI tools for resume analysis, cover letter generation, interview practice, and career roadmapping.

---

## System Architecture

SkillForge AI follows a modern, decoupled full-stack architecture built for responsiveness, reliability, and security:

```mermaid
graph TD
    subgraph Client["Frontend Client (Next.js 16 + React 19)"]
        UI["Candidate Cockpit & Pages"]
        AuthContext["Auth Context (JWT Storage)"]
        ApiClient["Typed API Client (Fetch Wrapper)"]
        StudyTimerWidget["Interactive Study Timer Widget"]
        UI --> AuthContext
        UI --> StudyTimerWidget
        UI --> ApiClient
        StudyTimerWidget --> ApiClient
    end

    subgraph Server["Backend API (FastAPI + Python 3.12)"]
        Router["FastAPI Application Routers"]
        AuthDep["JWT & User Isolation Dependency"]
        Lifespan["Startup Lifespan (Idempotent Seeder)"]
        AIService["AI Inference Service (Ollama / Cloud)"]
        
        Router --> AuthDep
        Router --> AIService
    end

    subgraph Persistence["Database Layer (PostgreSQL / Neon)"]
        Tables[("Users, Courses, Lessons,<br/>UserCompletions, StudySessions,<br/>Internships, Goals, Notes")]
    end

    subgraph Inference["Local / Remote Inference"]
        OllamaEngine["Ollama Server (gemma3:4b)"]
    end

    ApiClient -->|"HTTPS / JSON (Bearer Token)"| Router
    Router -->|"SQLAlchemy 2.0 (Connection Pool)"| Tables
    Lifespan -->|"Base.metadata.create_all + Seeder"| Tables
    AIService -->|"HTTP POST (Prompt + Schema)"| OllamaEngine
```

---

## Key Features

### 1. Candidate Cockpit (Dashboard)
- **Live Metrics**: Displays real-time metrics aggregated directly from PostgreSQL, including today's study minutes, current daily study streak (in days), weekly focus hours, active courses, and application pipeline totals.
- **Zero Fabrication**: All numbers represent actual database records associated with the authenticated user. New users receive clean, informative empty states.

### 2. Automatic Study-Time Tracking & Deep Work Timer
- **Server-Persisted State**: Session start timestamps, cumulative elapsed seconds, and pause/resume states are stored in PostgreSQL.
- **Refresh Resilience**: Does not rely on fragile client-side JavaScript intervals as the source of truth. Elapsed time is calculated dynamically from `last_resumed_at` and `duration_seconds`, allowing candidates to refresh the page or change tabs without losing their session.
- **Idempotent Controls**: Prevents duplicate records on accidental double-clicks.
- **Goal Synchronization**: Stopping a session automatically increments completed minutes toward the user's daily study goal.
- **Session History & Safe Editing**: Candidates can view their past study sessions, edit incorrect durations or skill labels, and delete invalid entries with strict authorization checks.

### 3. Curriculum Milestones & Course Management
- **Meaningful Progress**: Decouples study duration from course completion. Progress percentage is computed strictly as:
  $$\text{Progress} = \left(\frac{\text{Completed Milestones}}{\text{Total Course Lessons}}\right) \times 100$$
- **Interactive Checklists**: Enrolled students can check off hands-on milestones on the course detail page, updating their enrollment records and dashboard metrics instantly.
- **Curated Starter Catalog**: Comes pre-seeded with 3 comprehensive tracks and 19 practical milestones covering Python Systems, Full-Stack Next.js, and Data Structures & Algorithms.

### 4. Internship Application Pipeline Tracker
- **Stage Management**: Tracks applications through standard recruitment stages: `Saved`, `Applied`, `Assessment`, `Interview`, `Selected`, and `Rejected`.
- **Application Details**: Records company name, job role, job URL, compensation/stipend, deadline, and interview notes.
- **Pipeline Breakdown**: Summary counters provide immediate visibility into active interview loops.

### 5. Technical Notes & Revision Workspace
- **Subject Categorization**: Organize technical cheat sheets, system design notes, and interview learnings by topic.
- **Searchable Database**: Filter and review personal notes directly within the candidate cockpit.

### 6. AI Career Assistance Tools
- **Resume Reviewer**: Evaluates technical resumes against target software engineering job descriptions, providing targeted feedback on ATS alignment, formatting, and impactful metric framing.
- **Cover Letter Generator**: Generates customized, role-specific cover letters highlighting relevant candidate skills and technical projects.
- **Interview Question Generator**: Generates tailored technical, behavioral, and system design questions based on role and experience level.
- **Career Roadmap Planner**: Outlines structured learning roadmaps for target specializations (e.g., Backend Engineering, Cloud Infrastructure).

> **AI Provider Configuration Note:**
> In local development, AI features connect to a local **Ollama** instance running `gemma3:4b`. On cloud hosting (such as Render free-tier containers), local Ollama is not installed by default; cloud AI requires configuring an external `OLLAMA_BASE_URL` or inference provider. Endpoints return clear HTTP 503 diagnostics when an inference provider is unconfigured.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | Server-side rendering, routing, and Turbopack optimization |
| **Frontend UI** | **React 19 & TypeScript 5** | Type-safe UI components, hooks, and client state management |
| **Styling** | **Tailwind CSS 4** | Cyber-inspired dark theme and responsive layout system |
| **Icons** | **Lucide React** | Consistent, modern vector iconography |
| **Backend Framework** | **FastAPI (Python 3.12)** | High-performance asynchronous REST API |
| **Database ORM** | **SQLAlchemy 2.0** | Object-relational mapping, connection pooling, and pre-ping checks |
| **Database** | **PostgreSQL** | Relational persistence (Neon Serverless in cloud, PostgreSQL local) |
| **Authentication** | **JWT (`pyjwt`) & Argon2 (`pwdlib`)** | Cryptographically secure password hashing and token authorization |
| **Local Inference** | **Ollama (`gemma3:4b`)** | Privacy-first local large language model inference |
| **Testing** | **Pytest** | Automated unit, regression, and authorization test suites |

---

## Repository Structure

```
SkillForge-AI/
├── backend/                        # FastAPI Backend Application
│   ├── tests/                      # Automated test suite (55 tests)
│   │   ├── test_ai_endpoints.py
│   │   ├── test_ai_service.py
│   │   ├── test_deployment_config.py
│   │   ├── test_regression.py
│   │   └── test_study_sessions_and_progress.py
│   ├── ai.py                       # AI career tool API endpoints
│   ├── ai_service.py               # Inference prompt builder & client
│   ├── auth.py                     # JWT creation, password hashing, and user dependencies
│   ├── courses.py                  # Course catalog & lesson milestone toggle APIs
│   ├── dashboard.py                # Live cockpit summary calculations
│   ├── database.py                 # SQLAlchemy engine & URL resolution (Neon/Postgres)
│   ├── goals.py                    # Daily study and application goals APIs
│   ├── internships.py              # Internship Kanban tracker APIs
│   ├── main.py                     # FastAPI application entrypoint, CORS & lifespan
│   ├── models.py                   # SQLAlchemy database schemas
│   ├── notes.py                    # Technical revision notes APIs
│   ├── schemas.py                  # Pydantic validation schemas
│   ├── seed_courses.py             # Idempotent starter course catalog seeder
│   ├── study_sessions.py           # Deep work timer, streak, and history APIs
│   ├── requirements.txt            # Python runtime dependencies
│   └── .env.example                # Backend environment variable template
│
├── frontend-next/                  # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                    # Next.js App Router pages
│   │   │   ├── ai-tools/           # AI career workspace pages
│   │   │   ├── courses/            # Catalog, course detail & milestone checklist
│   │   │   ├── dashboard/          # Candidate Cockpit overview & live metrics
│   │   │   ├── goals/              # Daily goals view
│   │   │   ├── internships/        # Internship application tracker
│   │   │   ├── login/              # Authentication sign-in
│   │   │   ├── notes/              # Technical notes manager
│   │   │   └── register/           # Candidate registration
│   │   ├── components/             # Reusable UI widgets (StudyTimer, Cards, Badges)
│   │   ├── context/                # React Authentication Context & Session State
│   │   └── lib/                    # API client, TypeScript interfaces, and config
│   │       ├── api-client.ts       # Typed HTTP client with error handling
│   │       ├── config.ts           # Centralized environment configuration
│   │       └── types/              # Domain TypeScript interfaces
│   ├── package.json                # Frontend dependencies & build scripts
│   ├── tsconfig.json               # TypeScript configuration
│   └── .env.example                # Frontend environment variable template
│
└── README.md                       # Project documentation
```

---

## Prerequisites

Before setting up SkillForge AI locally, ensure you have the following installed:

1. **Python**: `3.11` or `3.12` ([Download Python](https://www.python.org/downloads/))
2. **Node.js**: `v18.x` or `v20.x` or higher ([Download Node.js](https://nodejs.org/))
3. **PostgreSQL**: A local PostgreSQL instance (v14+) or a free cloud database from [Neon](https://neon.tech)
4. **Git**: Version control ([Download Git](https://git-scm.com/))
5. *(Optional for AI Features)* **Ollama**: To run local AI models ([Download Ollama](https://ollama.com/))

---

## Local Setup & Installation

Follow these steps to run the complete SkillForge AI platform on your machine (commands tailored for Windows PowerShell):

### 1. Clone Repository

```powershell
git clone https://github.com/ishikamasih369-oss/Skillforge_AI.git
cd Skillforge_AI
```

---

### 2. Backend Setup (FastAPI & PostgreSQL)

1. Open a PowerShell terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

3. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Create your local environment configuration:
   ```powershell
   Copy-Item .env.example .env
   ```

5. Open `.env` and set your local PostgreSQL credentials and a secure JWT secret:
   ```env
   DB_USER=postgres
   DB_PASSWORD=your_local_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=skillforge_ai
   SECRET_KEY=generate_a_long_random_secret_string_here
   ```
   *(Alternatively, provide a single `DATABASE_URL` pointing to your local database or Neon cloud instance).*

6. Start the FastAPI development server:
   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
   ```
   *The backend will automatically create all database tables and seed the starter course catalog on first launch. Verify it is running at `http://localhost:8000`.*

---

### 3. Frontend Setup (Next.js & Tailwind CSS)

1. Open a second PowerShell terminal and navigate to the frontend directory:
   ```powershell
   cd frontend-next
   ```

2. Install Node dependencies:
   ```powershell
   npm install
   ```

3. Create your frontend environment configuration:
   ```powershell
   Copy-Item .env.example .env.local
   ```
   *(By default, `NEXT_PUBLIC_API_URL=http://localhost:8000` points to the local FastAPI backend).*

4. Start the Next.js development server:
   ```powershell
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

### 4. Optional: Local AI Engine (Ollama)

To test the AI career tools locally without paying for API tokens:

1. Download and install Ollama from [ollama.com](https://ollama.com).
2. Pull the default lightweight model used by SkillForge AI:
   ```powershell
   ollama pull gemma3:4b
   ```
3. Ensure the Ollama background service is running on `http://localhost:11434`.

---

## Environment Variables

### Backend Environment Variables (`backend/.env`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `DATABASE_URL` | Optional | Complete PostgreSQL connection string (takes precedence; used by Neon/Render) | `postgresql://user:pass@ep-host.neon.tech/dbname?sslmode=require` |
| `DB_USER` | Local only | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | Local only | PostgreSQL password | `secret_password` |
| `DB_HOST` | Local only | PostgreSQL host | `localhost` |
| `DB_PORT` | Local only | PostgreSQL port (defaults to 5432) | `5432` |
| `DB_NAME` | Local only | PostgreSQL database name | `skillforge_ai` |
| `SECRET_KEY` | **Required** | Secret key used to sign and verify JWT authentication tokens | `secure_random_hex_string` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of additional CORS origins (e.g. Vercel domain) | `https://your-frontend.vercel.app` |
| `OLLAMA_BASE_URL` | Optional | HTTP address of the local or remote Ollama server | `http://localhost:11434` |
| `OLLAMA_MODEL` | Optional | Model identifier to use for career tools | `gemma3:4b` |
| `OLLAMA_TIMEOUT_SECONDS` | Optional | Timeout limit for inference generations | `180` |

### Frontend Environment Variables (`frontend-next/.env.local`)

| Variable | Required | Description | Example / Default |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Required** | Public API URL pointing to the FastAPI backend | `http://localhost:8000` (local) or `https://your-backend.onrender.com` |

> [!IMPORTANT]
> Never commit `.env` or `.env.local` files to Git. All secret keys, database credentials, and internal tokens must remain server-side.

---

## Database Setup & Seeding

SkillForge AI manages its database lifecycle safely and automatically:

1. **Automatic Table Initialization**: On backend startup, `Base.metadata.create_all(bind=engine)` in `backend/main.py` creates all necessary tables in PostgreSQL if they do not already exist (`users`, `courses`, `course_lessons`, `user_courses`, `user_lesson_completions`, `study_sessions`, `daily_goals`, `internships`, `notes`).
2. **Idempotent Course Catalog Seeding**: During FastAPI's `lifespan` startup event, `seed_starter_courses(db)` inspects the database and seeds the 3 foundational tracks and 19 milestones. Re-running the application or restarting the server never creates duplicate courses or resets candidate progress.
3. **Data Boundary Separation**: Courses are shared catalog entities. Each candidate's enrollment (`UserCourse`), milestone completions (`UserLessonCompletion`), study sessions (`StudySession`), and applications (`Internship`) are strictly scoped by `user_id`.

---

## API Overview & Interactive Documentation

FastAPI automatically generates interactive OpenAPI documentation. When the backend is running locally, access:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Primary API Groups

| Prefix | Purpose | Key Endpoints |
|---|---|---|
| `/api/auth` | User identity & authentication | `POST /register`, `POST /login`, `GET /me` |
| `/api/dashboard` | Aggregated candidate metrics | `GET /summary` |
| `/api/study-sessions` | Deep work timer, streaks & history | `GET /active`, `POST /start`, `POST /{id}/pause`, `POST /{id}/resume`, `POST /{id}/stop`, `GET /stats`, `PUT /{id}`, `DELETE /{id}` |
| `/api/courses` | Catalog, enrollment & milestones | `GET /`, `GET /{id}`, `POST /{id}/enroll`, `GET /{id}/lessons`, `POST /{id}/lessons/{lesson_id}/toggle` |
| `/api/goals` | Daily study and application goals | `GET /today`, `PUT /update` |
| `/api/internships` | Application pipeline management | `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}` |
| `/api/notes` | Technical revision notes | `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}` |
| `/api/ai` | AI career assistance tools | `POST /resume-review`, `POST /cover-letter`, `POST /interview-questions`, `POST /career-roadmap`, `GET /health` |

---

## Testing & Quality Assurance

SkillForge AI maintains automated test coverage across authentication, timer state recovery, user isolation, course milestone recalculation, and AI service resilience.

### Run All Backend Tests (55 Tests)

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests -v
```

**Verified Test Results**:
```
tests/test_ai_endpoints.py .............                                [ 23%]
tests/test_ai_service.py .............                                  [ 47%]
tests/test_deployment_config.py .........                               [ 63%]
tests/test_regression.py .............                                  [ 87%]
tests/test_study_sessions_and_progress.py .......                       [100%]
======================= 55 passed, 69 warnings in 1.94s =======================
```

### Validate Frontend Types & Code Quality

```powershell
cd frontend-next

# 1. Type validation
npx tsc --noEmit

# 2. ESLint code standard check
npx eslint

# 3. Production build test (Turbopack)
npm run build
```

**Verified Build Output**:
- Zero TypeScript compiler errors.
- Zero ESLint warnings or errors.
- All 18 application routes successfully compiled and optimized.

---

## Production Deployment

SkillForge AI is architected for zero-cost to low-cost cloud deployment:

- **Frontend**: Hosted on [Vercel](https://vercel.com) (Next.js auto-deployment from Git).
  - Configured Environment Variable: `NEXT_PUBLIC_API_URL` set to the production Render backend URL.
- **Backend**: Hosted on [Render](https://render.com) (Web Service running Uvicorn).
  - Configured Environment Variables: `DATABASE_URL` (Neon PostgreSQL), `SECRET_KEY`, and `ALLOWED_ORIGINS` (including the Vercel production frontend URL to satisfy CORS).
  - Startup Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Database**: Cloud PostgreSQL hosted on [Neon](https://neon.tech) (serverless compute with SSL mode enabled).

---

## Known Limitations & Roadmap

- **Production Cloud AI Provider**: Render free-tier Linux instances (512MB RAM) cannot run a local Ollama process. Enabling production AI features on Render requires setting `OLLAMA_BASE_URL` to an external inference host or configuring a cloud inference adapter (e.g. Groq or Gemini API).
- **Multi-Tab Timer Synchronization**: The study timer state updates accurately on page refresh or component mount; real-time synchronization across simultaneously open browser tabs via WebSockets is planned for a future release.
- **PDF Resume Upload**: Current resume review accepts raw text/markdown input; an automated PDF/DOCX text extraction pipeline is planned.

---

## Security & Privacy

- **Row-Level Isolation**: All database queries enforce user scoping based on the validated JWT claims (`User.id == current_user.id`), preventing cross-tenant data access.
- **Password Protection**: Passwords are never stored in plaintext; hashing uses Argon2 via `pwdlib`.
- **CORS Protection**: CORS middleware strictly validates incoming origins against explicit whitelists and explicitly forbids wildcard (`*`) access with credentials enabled.
- **Credential Safety**: Connection strings, secrets, and API tokens are kept strictly in `.env` files and excluded from version control via `.gitignore`.

---

## Contributing & License

Contributions, suggestions, and issue reports are welcome! If you encounter a bug or have an idea for an enhancement:
1. Open an issue on GitHub describing the proposed change.
2. Fork the repository and create a feature branch (`git checkout -b feature/improvement`).
3. Ensure all backend tests (`pytest`) and frontend checks (`tsc`, `eslint`, `build`) pass.
4. Submit a Pull Request with a clear description of your changes.

### License

*A formal open-source license has not yet been assigned to this repository. All rights are reserved by the project owner.*
