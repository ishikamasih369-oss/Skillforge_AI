import { API_BASE_URL } from "./config";
import { tokenStorage } from "./token-storage";
import type {
  AuthResponse,
  DashboardSummary,
  LoginRequest,
  RegisterRequest,
  User,
  ApiValidationErrorItem,
  ApiErrorPayload,
  Course,
  MyCourse,
  EnrollResponse,
  ProgressUpdateResponse,
  CourseCreate,
  DailyGoal,
  GoalStreak,
  GoalHistoryItem,
  GoalActionResponse,
  Internship,
  InternshipCreate,
  InternshipStatus,
  InternshipStats,
  InternshipActionResponse,
  Note,
  NoteCreate,
  NoteUpdate,
  NoteActionResponse,
  ResumeReviewRequest,
  ResumeReviewResponse,
  CoverLetterRequest,
  CoverLetterResponse,
  InterviewQuestionsRequest,
  InterviewQuestionsResponse,
  CareerRoadmapRequest,
  CareerRoadmapResponse,
} from "./types/auth";

export class ApiError extends Error {
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Parses API error response and extracts a user-friendly error message.
 * Handles FastAPI 422 validation lists, 400/401/403/500 JSON error objects, and non-JSON HTML/text errors.
 */
function extractErrorMessage(status: number, data: unknown): string {
  if (!data) {
    return `Request failed with status ${status}`;
  }

  if (typeof data === "string") {
    // If response was HTML or plain text, return trimmed or default error
    if (data.startsWith("<") || data.includes("<!DOCTYPE")) {
      return `Server error (${status}). Please try again later.`;
    }
    return data.slice(0, 300);
  }

  const payload = data as ApiErrorPayload;

  // Case 1: detail is a string (e.g., "Invalid email or password", "Email is already registered")
  if (typeof payload.detail === "string" && payload.detail.trim().length > 0) {
    return payload.detail;
  }

  // Case 2: detail is a list of FastAPI validation errors (e.g. 422 Unprocessable Entity)
  if (Array.isArray(payload.detail) && payload.detail.length > 0) {
    const errorMessages = (payload.detail as ApiValidationErrorItem[])
      .map((item) => {
        const field = item.loc && item.loc.length > 0 ? item.loc[item.loc.length - 1] : "";
        const cleanMsg = item.msg || "Invalid input";
        return field ? `${field}: ${cleanMsg}` : cleanMsg;
      })
      .filter(Boolean);

    if (errorMessages.length > 0) {
      return errorMessages.join(" • ");
    }
  }

  // Case 3: generic message field
  if (payload.message && typeof payload.message === "string") {
    return payload.message;
  }

  return `Request failed with status ${status}`;
}

interface RequestOptions extends RequestInit {
  token?: string | null;
}

/**
 * Universal request wrapper for FastAPI backend communication.
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...customConfig } = options;

  // Base URL sanitization
  const cleanBase = API_BASE_URL.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;

  // Build headers
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (typeof headers === "object" && headers !== null) {
    Object.assign(reqHeaders, headers);
  }

  // Authorization token injection
  const activeToken = token ?? tokenStorage.getToken();
  if (activeToken) {
    reqHeaders["Authorization"] = `Bearer ${activeToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...customConfig,
      headers: reqHeaders,
    });
  } catch (error) {
    // Network failure (offline, CORS failure, connection refused, DNS error)
    const errorMsg =
      error instanceof Error && error.message
        ? `Unable to connect to the backend server (${error.message}). Please ensure FastAPI is running on ${API_BASE_URL}.`
        : `Unable to connect to the backend server. Please ensure FastAPI is running on ${API_BASE_URL}.`;
    throw new ApiError(errorMsg, 0, error);
  }

  // Parse response body
  const contentType = response.headers.get("content-type") || "";
  let data: unknown = null;

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(response.status, data);
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

/**
 * SkillForge Backend API Client
 */
export const apiClient = {
  /**
   * Register a new user account.
   * Backend endpoint: POST /api/auth/register
   */
  async register(data: RegisterRequest): Promise<User> {
    return request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Authenticate an existing user and obtain a JWT access token.
   * Backend endpoint: POST /api/auth/login
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Fetch current authenticated user's profile.
   * Backend endpoint: GET /api/auth/me
   */
  async getMe(token?: string): Promise<User> {
    return request<User>("/api/auth/me", {
      method: "GET",
      token,
    });
  },

  /**
   * Fetch real dashboard metrics.
   * Backend endpoint: GET /api/dashboard/summary
   */
  async getDashboardSummary(token?: string): Promise<DashboardSummary> {
    return request<DashboardSummary>("/api/dashboard/summary", {
      method: "GET",
      token,
    });
  },

  // ==========================================
  // Courses API Methods
  // ==========================================

  /**
   * Fetch all courses in catalog.
   * Backend endpoint: GET /api/courses/
   */
  async getCourses(): Promise<Course[]> {
    return request<Course[]>("/api/courses/", {
      method: "GET",
    });
  },

  /**
   * Fetch details of a specific course by id.
   * Backend endpoint: GET /api/courses/{course_id}
   */
  async getCourse(courseId: number): Promise<Course> {
    return request<Course>(`/api/courses/${courseId}`, {
      method: "GET",
    });
  },

  /**
   * Fetch all courses enrolled by the authenticated user.
   * Backend endpoint: GET /api/courses/my-courses
   */
  async getMyCourses(token?: string): Promise<MyCourse[]> {
    return request<MyCourse[]>("/api/courses/my-courses", {
      method: "GET",
      token,
    });
  },

  /**
   * Enroll the authenticated user into a course.
   * Backend endpoint: POST /api/courses/{course_id}/enroll
   */
  async enrollCourse(courseId: number, token?: string): Promise<EnrollResponse> {
    return request<EnrollResponse>(`/api/courses/${courseId}/enroll`, {
      method: "POST",
      token,
    });
  },

  /**
   * Update progress percentage for an enrolled course.
   * Backend endpoint: PUT /api/courses/{course_id}/progress
   */
  async updateCourseProgress(
    courseId: number,
    progress: number,
    token?: string
  ): Promise<ProgressUpdateResponse> {
    return request<ProgressUpdateResponse>(`/api/courses/${courseId}/progress`, {
      method: "PUT",
      body: JSON.stringify({ progress }),
      token,
    });
  },

  /**
   * Create a new course in the catalog.
   * Backend endpoint: POST /api/courses/
   */
  async createCourse(data: CourseCreate, token?: string): Promise<Course> {
    return request<Course>("/api/courses/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  // ==========================================
  // Daily Goals API Methods
  // ==========================================

  /**
   * Fetch today's goal for the authenticated user.
   * Returns null if no goal was created for today (404 handled gracefully).
   * Backend endpoint: GET /api/goals/today
   */
  async getTodayGoal(token?: string): Promise<DailyGoal | null> {
    try {
      return await request<DailyGoal>("/api/goals/today", {
        method: "GET",
        token,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Create a daily learning goal for today.
   * Backend endpoint: POST /api/goals/
   */
  async createDailyGoal(
    targetMinutes: number,
    token?: string
  ): Promise<GoalActionResponse> {
    return request<GoalActionResponse>("/api/goals/", {
      method: "POST",
      body: JSON.stringify({ target_minutes: targetMinutes }),
      token,
    });
  },

  /**
   * Update completed minutes for today's goal.
   * Backend endpoint: PUT /api/goals/progress
   */
  async updateGoalProgress(
    completedMinutes: number,
    token?: string
  ): Promise<GoalActionResponse> {
    return request<GoalActionResponse>("/api/goals/progress", {
      method: "PUT",
      body: JSON.stringify({ completed_minutes: completedMinutes }),
      token,
    });
  },

  /**
   * Fetch learning streak information for the authenticated user.
   * Backend endpoint: GET /api/goals/streak
   */
  async getGoalStreak(token?: string): Promise<GoalStreak> {
    return request<GoalStreak>("/api/goals/streak", {
      method: "GET",
      token,
    });
  },

  /**
   * Fetch history of daily goals for the authenticated user.
   * Backend endpoint: GET /api/goals/history
   */
  async getGoalHistory(token?: string): Promise<GoalHistoryItem[]> {
    return request<GoalHistoryItem[]>("/api/goals/history", {
      method: "GET",
      token,
    });
  },

  // ==========================================
  // Internships API Methods
  // ==========================================

  /**
   * Fetch all internship applications for the authenticated user.
   * Backend endpoint: GET /api/internships/
   */
  async getInternships(token?: string): Promise<Internship[]> {
    return request<Internship[]>("/api/internships/", {
      method: "GET",
      token,
    });
  },

  /**
   * Fetch aggregate statistics for the user's internship applications.
   * Backend endpoint: GET /api/internships/stats
   */
  async getInternshipStats(token?: string): Promise<InternshipStats> {
    return request<InternshipStats>("/api/internships/stats", {
      method: "GET",
      token,
    });
  },

  /**
   * Create a new internship application.
   * Backend endpoint: POST /api/internships/
   */
  async createInternship(
    data: InternshipCreate,
    token?: string
  ): Promise<Internship> {
    return request<Internship>("/api/internships/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Update the status of an internship application.
   * Backend endpoint: PATCH /api/internships/{internship_id}/status
   */
  async updateInternshipStatus(
    internshipId: number,
    status: InternshipStatus,
    token?: string
  ): Promise<InternshipActionResponse> {
    return request<InternshipActionResponse>(
      `/api/internships/${internshipId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status }),
        token,
      }
    );
  },

  /**
   * Delete an internship application.
   * Backend endpoint: DELETE /api/internships/{internship_id}
   */
  async deleteInternship(
    internshipId: number,
    token?: string
  ): Promise<InternshipActionResponse> {
    return request<InternshipActionResponse>(
      `/api/internships/${internshipId}`,
      {
        method: "DELETE",
        token,
      }
    );
  },

  // ==========================================
  // Notes API Methods
  // ==========================================

  /**
   * Fetch all notes for the authenticated user (sorted by updated_at desc).
   * Backend endpoint: GET /api/notes/
   */
  async getNotes(token?: string): Promise<Note[]> {
    return request<Note[]>("/api/notes/", {
      method: "GET",
      token,
    });
  },

  /**
   * Create a new note.
   * Backend endpoint: POST /api/notes/
   */
  async createNote(data: NoteCreate, token?: string): Promise<Note> {
    return request<Note>("/api/notes/", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Update an existing note by ID.
   * Backend endpoint: PUT /api/notes/{note_id}
   */
  async updateNote(
    noteId: number,
    data: NoteUpdate,
    token?: string
  ): Promise<Note> {
    return request<Note>(`/api/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Delete a note by ID.
   * Backend endpoint: DELETE /api/notes/{note_id}
   */
  async deleteNote(
    noteId: number,
    token?: string
  ): Promise<NoteActionResponse> {
    return request<NoteActionResponse>(`/api/notes/${noteId}`, {
      method: "DELETE",
      token,
    });
  },

  // ==========================================
  // Local AI Workspace API Methods (FastAPI -> Ollama)
  // ==========================================

  /**
   * Evaluate a plain-text resume against optional target role or job description.
   * Backend endpoint: POST /api/ai/resume-review
   */
  async reviewResume(
    data: ResumeReviewRequest,
    token?: string
  ): Promise<ResumeReviewResponse> {
    return request<ResumeReviewResponse>("/api/ai/resume-review", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Generate a truthful, tailored cover letter based on user-provided experience facts.
   * Backend endpoint: POST /api/ai/cover-letter
   */
  async generateCoverLetter(
    data: CoverLetterRequest,
    token?: string
  ): Promise<CoverLetterResponse> {
    return request<CoverLetterResponse>("/api/ai/cover-letter", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Generate customized mock interview questions, difficulty ratings, and answer outlines.
   * Backend endpoint: POST /api/ai/interview-questions
   */
  async generateInterviewQuestions(
    data: InterviewQuestionsRequest,
    token?: string
  ): Promise<InterviewQuestionsResponse> {
    return request<InterviewQuestionsResponse>("/api/ai/interview-questions", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },

  /**
   * Generate a phased learning roadmap based on skills and study hours, cross-referenced with DB courses.
   * Backend endpoint: POST /api/ai/career-roadmap
   */
  async generateCareerRoadmap(
    data: CareerRoadmapRequest,
    token?: string
  ): Promise<CareerRoadmapResponse> {
    return request<CareerRoadmapResponse>("/api/ai/career-roadmap", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    });
  },
};
