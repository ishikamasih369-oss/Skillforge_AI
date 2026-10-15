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

