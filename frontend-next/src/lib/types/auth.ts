export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DashboardSummary {
  courses: {
    enrolled: number;
    completed: number;
    list?: Array<{
      course_id: number;
      title: string;
      category: string;
      difficulty: string;
      progress: number;
      completed: boolean;
    }>;
  };
  internships: {
    total: number;
    Saved: number;
    Applied: number;
    Assessment: number;
    Interview: number;
    Rejected: number;
    Selected: number;
  };
  daily_goal: {
    target_minutes: number;
    completed_minutes: number;
    completed: boolean;
  };
  study_stats?: {
    today_study_seconds: number;
    week_study_seconds: number;
    current_streak_days: number;
    total_sessions_count: number;
  };
  active_session?: {
    id: number;
    course_id: number | null;
    course_title: string | null;
    skill_name: string;
    start_time: string;
    duration_seconds: number;
    current_elapsed_seconds: number;
    is_active: boolean;
    is_paused: boolean;
  } | null;
  recent_sessions?: Array<{
    id: number;
    course_id: number | null;
    course_title: string | null;
    skill_name: string;
    start_time: string;
    end_time: string | null;
    duration_seconds: number;
  }>;
}

export interface ApiValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorPayload {
  detail?: string | ApiValidationErrorItem[];
  message?: string;
  status?: string;
}

export * from "./courses";
export * from "./goals";
export * from "./internships";
export * from "./notes";
export * from "./ai";
export * from "./study";

