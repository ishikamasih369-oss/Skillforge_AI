export interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructor: string;
  duration_hours: number;
  image_url: string | null;
  is_published: boolean;
}

export interface MyCourse {
  course_id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructor: string;
  duration_hours: number;
  image_url: string | null;
  progress: number;
  completed: boolean;
}

export interface EnrollResponse {
  message: string;
  course_id: number;
  user_id: number;
  progress: number;
  completed: boolean;
}

export interface ProgressUpdateResponse {
  message: string;
  course_id: number;
  progress: number;
  completed: boolean;
}

export interface CourseCreate {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  instructor: string;
  duration_hours: number;
  image_url?: string | null;
  is_published?: boolean;
}

export interface CourseLesson {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order_index: number;
  duration_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
}

export interface CourseLessonsProgress {
  course_id: number;
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  completed: boolean;
  lessons: CourseLesson[];
}
