/**
 * Application Configuration
 * Provides centralized access to frontend environment variables with resilient fallbacks.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const APP_CONFIG = {
  name: "SkillForge AI",
  tagline: "Your AI-Powered Career & Learning Companion",
  description:
    "Master high-demand tech skills, track your progress and internships, and prepare with local AI career tools.",
  version: "1.0.0",
} as const;
