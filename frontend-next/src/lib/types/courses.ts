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
