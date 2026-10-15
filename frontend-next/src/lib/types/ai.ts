import type { Course } from "./courses";

// ==========================================
// AI Resume Reviewer Types
// ==========================================

export interface ResumeReviewRequest {
  resume_text: string;
  target_role?: string | null;
  target_job_description?: string | null;
}

export interface ResumeReviewResponse {
  summary: string;
  overall_score: number;
  score_explanation: string;
  strengths: string[];
  areas_for_improvement: string[];
  skills_identified: string[];
  matching_skills: string[];
  missing_or_weak_skills: string[];
  actionable_recommendations: string[];
  disclaimer: string;
}

// ==========================================
// AI Cover Letter Generator Types
// ==========================================

export type CoverLetterTone =
  | "professional"
  | "enthusiastic"
  | "technical"
  | "concise";

export interface CoverLetterRequest {
  target_role: string;
  company_name: string;
  job_description: string;
  experience_summary: string;
  tone?: CoverLetterTone;
}

export interface CoverLetterResponse {
  target_role: string;
  company_name: string;
  cover_letter: string;
  verification_checklist: string[];
  key_highlights_used: string[];
}

// ==========================================
// AI Interview Preparation Types
// ==========================================

export type InterviewExperienceLevel =
  | "Entry-level / Intern"
  | "Junior"
  | "Mid-level"
  | "Senior";

export type InterviewType =
  | "technical"
  | "behavioral"
  | "mixed"
  | "system_design";

export type QuestionDifficulty = "Easy" | "Medium" | "Hard";

export interface InterviewQuestionsRequest {
  target_role: string;
  experience_level?: InterviewExperienceLevel;
  interview_type?: InterviewType;
  skills_or_topics?: string[] | null;
  job_description?: string | null;
  num_questions?: number;
}

export interface InterviewQuestionItem {
  id: number;
  question: string;
  category: string;
  difficulty: QuestionDifficulty;
  key_concepts: string[];
  sample_answer_outline: string[];
}

export interface InterviewQuestionsResponse {
  target_role: string;
  experience_level: string;
  interview_type: string;
  questions: InterviewQuestionItem[];
  preparation_tips: string[];
  disclaimer: string;
}

// ==========================================
// AI Career Roadmap Types
// ==========================================

export type CareerExperienceLevel =
  | "Beginner / Student"
  | "Intermediate"
  | "Advanced";

export interface CareerRoadmapRequest {
  target_role: string;
  current_skills: string[];
  experience_level?: CareerExperienceLevel;
  weekly_hours_available: number;
  career_goals?: string | null;
  preferred_topics?: string[] | null;
}

export interface RoadmapPhase {
  phase_number: number;
  title: string;
  duration_weeks: intToNumber;
  focus_areas: string[];
  milestones: string[];
  practice_projects: string[];
  verification_methods: string[];
  recommended_topics: string[];
}

type intToNumber = number;

export interface CareerRoadmapResponse {
  target_role: string;
  experience_level: string;
  weekly_hours_available: number;
  estimated_total_weeks: number;
  current_strengths: string[];
  skill_gaps: string[];
  phases: RoadmapPhase[];
  database_course_matches: Course[];
  disclaimer: string;
}
