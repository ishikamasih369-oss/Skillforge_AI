export interface DailyGoal {
  goal_id: number;
  target_minutes: number;
  completed_minutes: number;
  completed: boolean;
}

export interface GoalStreak {
  current_streak: number;
  longest_streak: number;
}

export interface GoalHistoryItem {
  goal_id: number;
  date: string;
  target_minutes: number;
  completed_minutes: number;
  completed: boolean;
}

export interface DailyGoalCreate {
  target_minutes: number;
}

export interface GoalProgressUpdate {
  completed_minutes: number;
}

export interface GoalActionResponse {
  message: string;
  goal_id: number;
  target_minutes: number;
  completed_minutes: number;
  completed: boolean;
}
