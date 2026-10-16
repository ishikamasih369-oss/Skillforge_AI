export interface StudySession {
  id: number;
  user_id: number;
  course_id: number | null;
  course_title: string | null;
  skill_name: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  is_active: boolean;
  is_paused: boolean;
  current_elapsed_seconds: number;
  created_at: string;
}

export interface StudySessionStartRequest {
  course_id?: number | null;
  skill_name: string;
}

export interface StudySessionUpdateRequest {
  duration_seconds: number;
  skill_name?: string;
}

export interface StudyStats {
  today_study_seconds: number;
  week_study_seconds: number;
  current_streak_days: number;
  total_sessions_count: number;
  recent_sessions: StudySession[];
}
