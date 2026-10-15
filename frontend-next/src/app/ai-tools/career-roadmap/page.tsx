"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  BookOpen,
  Code,
  CheckSquare,
  Target,
  ExternalLink,
  Milestone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
  CareerExperienceLevel,
  CareerRoadmapRequest,
  CareerRoadmapResponse,
} from "@/lib/types/ai";

const EXPERIENCE_LEVELS: CareerExperienceLevel[] = [
  "Beginner / Student",
  "Intermediate",
  "Advanced",
];

export default function CareerRoadmapPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form inputs
  const [targetRole, setTargetRole] = useState<string>("");
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [experienceLevel, setExperienceLevel] =
    useState<CareerExperienceLevel>("Beginner / Student");
  const [weeklyHours, setWeeklyHours] = useState<number>(15);
  const [careerGoals, setCareerGoals] = useState<string>("");
  const [preferredTopicsInput, setPreferredTopicsInput] = useState<string>("");

  // Output states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CareerRoadmapResponse | null>(null);

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/ai-tools/career-roadmap");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (targetRole.trim().length < 2) {
      setError("Please provide a target role title (at least 2 characters).");
      return;
    }

    const currentSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (currentSkills.length === 0) {
      setError("Please list at least one current skill (e.g. Python, Git, HTML).");
      return;
    }

    const preferredTopics = preferredTopicsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    setIsLoading(true);
    setError(null);

    const payload: CareerRoadmapRequest = {
      target_role: targetRole.trim(),
      current_skills: currentSkills,
      experience_level: experienceLevel,
      weekly_hours_available: weeklyHours,
      career_goals: careerGoals.trim() ? careerGoals.trim() : null,
      preferred_topics: preferredTopics.length > 0 ? preferredTopics : null,
    };

    try {
      const data = await apiClient.generateCareerRoadmap(payload, token);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setError(
            "Local Ollama service is unavailable. Please verify that Ollama is running ('ollama serve') and model 'gemma3:4b' is downloaded."
          );
        } else if (err.status === 504) {
          setError(
            "Roadmap generation timed out. Local models may take 60-90 seconds on first run. Please retry."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to generate career roadmap. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setTargetRole("Senior Backend Engineer");
    setSkillsInput("Python, SQL, Git, Basic Docker, REST APIs");
    setExperienceLevel("Intermediate");
    setWeeklyHours(15);
    setCareerGoals(
      "Transition from junior developer to a backend engineer capable of designing distributed systems, caching architectures, and high-concurrency microservices."
    );
    setPreferredTopicsInput("PostgreSQL, Redis, Distributed Systems, Microservices, CI/CD");
    setError(null);
  };

  if (authLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/25 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-pink-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-pink-400 transition-colors">
            Candidate Cockpit
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link href="/ai-tools" className="hover:text-pink-400 transition-colors">
            AI Workspace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Career Roadmap</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="glow" size="sm">
                Phased Study Plan
              </Badge>
              <Badge variant="outline" size="sm" className="text-slate-400 border-[#23283B]">
                SkillForge Catalog Matched
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Compass className="w-7 h-7 text-pink-400" />
              <span>Personalized Career Roadmap</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Construct a structured, week-by-week learning trajectory tailored to your weekly bandwidth, complete with milestones, projects, and verified SkillForge courses.
            </p>
          </div>

          <Link href="/ai-tools">
            <Button variant="outline" size="sm" className="text-xs border-[#252C42]">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>All AI Tools</span>
            </Button>
          </Link>
        </div>

        {/* Privacy Note */}
        <div className="p-3.5 rounded-xl bg-[#11141E] border border-pink-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-medium">100% Private Synthesis:</strong> Your study goals and career preferences are synthesized locally via open-weights Gemma 3.
            </span>
          </div>
          <span className="text-[11px] font-mono text-pink-400/80 hidden sm:inline">
            Ollama: gemma3:4b
          </span>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-300 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white block">Notice</span>
                <span>{error}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Learning Parameters
                  </CardTitle>
                  <p className="text-[11px] text-slate-400">
                    Target destination and weekly hours
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-[11px] text-pink-400 hover:text-pink-300 py-0.5 px-2"
                >
                  Load Sample
                </Button>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Target Career Role *"
                    placeholder="e.g. Senior Backend Engineer, DevOps Specialist"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                  />

                  {/* Current Skills */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Your Current Skills * (Comma separated)
                    </label>
                    <textarea
                      rows={2}
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      placeholder="e.g. Python, SQL, Git, Basic Docker, REST APIs"
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Seniority Level */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Current Experience Tier
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={`p-2 rounded-lg border text-center text-xs transition-all ${
                            experienceLevel === level
                              ? "bg-pink-500/15 border-pink-500 text-white font-medium ring-1 ring-pink-500/50"
                              : "bg-[#0A0D15] border-[#202536] text-slate-400 hover:text-white"
                          }`}
                        >
                          {level.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Hours Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Weekly Study Commitment: <strong className="text-pink-400">{weeklyHours} hrs/week</strong>
                      </label>
                      <span className="text-[10px] text-slate-500">1 – 80 hrs</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={80}
                      value={weeklyHours}
                      onChange={(e) => setWeeklyHours(Number(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                  </div>

                  {/* Career Goals */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Specific Career Ambitions (Optional)
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">
                        {careerGoals.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={500}
                      value={careerGoals}
                      onChange={(e) => setCareerGoals(e.target.value)}
                      placeholder="e.g. Pass tier-1 technical interviews, master distributed systems..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Preferred Topics */}
                  <Input
                    label="Preferred Topics / Technologies (Optional)"
                    placeholder="e.g. Redis, Kubernetes, Kafka, TypeScript"
                    value={preferredTopicsInput}
                    onChange={(e) => setPreferredTopicsInput(e.target.value)}
                  />

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isLoading || targetRole.trim().length < 2 || !skillsInput.trim()}
                      isLoading={isLoading}
                      className="w-full text-xs font-semibold py-2.5 shadow-lg shadow-pink-500/20"
                    >
                      <Compass className="w-4 h-4 mr-1.5" />
                      <span>{isLoading ? "Synthesizing Roadmap..." : "Generate Phased Roadmap"}</span>
                    </Button>
                    {isLoading && (
                      <p className="text-[11px] text-slate-400 text-center mt-2 animate-pulse">
                        Analyzing skill gaps and cross-referencing SkillForge catalog via local Gemma 3 (20-60s)...
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Results Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="p-8 rounded-2xl bg-[#11141E] border border-[#202536] space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Synthesizing Phased Learning Roadmap
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Estimating study weeks, identifying bridge skills, and querying SkillForge PostgreSQL course catalog on your local machine.
                  </p>
                </div>
              </div>
            ) : result ? (
              /* Roadmap Output Display */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Overview Header Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#11141E] border border-[#202536]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Target Role
                    </span>
                    <p className="text-sm font-bold text-white truncate mt-1">
                      {result.target_role}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#11141E] border border-pink-500/30">
                    <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider block">
                      Total Duration
                    </span>
                    <p className="text-lg font-bold text-pink-300 mt-1">
                      ~{result.estimated_total_weeks} Weeks
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#11141E] border border-[#202536]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Pacing
                    </span>
                    <p className="text-sm font-bold text-white mt-1">
                      {result.weekly_hours_available} hrs / wk
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#11141E] border border-[#202536]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Roadmap Phases
                    </span>
                    <p className="text-lg font-bold text-white mt-1">
                      {result.phases.length} Phases
                    </p>
                  </div>
                </div>

                {/* Strengths & Gaps Analysis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Current Strengths */}
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Baseline Strengths ({result.current_strengths.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {result.current_strengths.map((str, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                          >
                            ✓ {str}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skill Gaps */}
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>Identified Skill Gaps ({result.skill_gaps.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {result.skill_gaps.map((gap, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          >
                            ⚡ {gap}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline Step-by-Step Phases */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Milestone className="w-4 h-4 text-pink-400" />
                    <span>Phased Learning Milestones</span>
                  </h3>

                  <div className="space-y-4">
                    {result.phases.map((phase) => (
                      <Card
                        key={phase.phase_number}
                        className="bg-[#11141E] border-[#202536] relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-pink-500 to-rose-600" />
                        <CardHeader className="p-4 pb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-md bg-pink-500/20 text-pink-300 text-xs font-bold flex items-center justify-center shrink-0">
                                {phase.phase_number}
                              </span>
                              <CardTitle className="text-base font-bold text-white">
                                {phase.title}
                              </CardTitle>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-pink-400 font-mono font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              <span>~{phase.duration_weeks} Weeks</span>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-4 pt-1 space-y-3.5">
                          {/* Focus Areas */}
                          {phase.focus_areas.length > 0 && (
                            <div>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Core Focus Areas:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {phase.focus_areas.map((fa, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[10px] bg-[#161B2B] text-slate-300 border border-[#252C42]"
                                  >
                                    {fa}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Milestones & Projects Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* Milestones */}
                            {phase.milestones.length > 0 && (
                              <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1C2132] space-y-1.5">
                                <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider block flex items-center gap-1">
                                  <CheckSquare className="w-3 h-3" /> Key Milestones:
                                </span>
                                <ul className="space-y-1 text-slate-300 text-[11px]">
                                  {phase.milestones.map((ms, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0 mt-1" />
                                      <span>{ms}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Practice Projects */}
                            {phase.practice_projects.length > 0 && (
                              <div className="p-3 rounded-lg bg-[#0A0D15] border border-[#1C2132] space-y-1.5">
                                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
                                  <Code className="w-3 h-3" /> Practice Projects:
                                </span>
                                <ul className="space-y-1 text-slate-300 text-[11px]">
                                  {phase.practice_projects.map((proj, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1" />
                                      <span>{proj}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Verification Methods */}
                          {phase.verification_methods.length > 0 && (
                            <div className="text-[11px] text-slate-400 flex items-start gap-2 pt-1 border-t border-[#1C2030]">
                              <span className="font-semibold text-slate-300 shrink-0">Verification:</span>
                              <span>{phase.verification_methods.join(" • ")}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* SkillForge Database Matched Courses */}
                {result.database_course_matches && result.database_course_matches.length > 0 && (
                  <Card className="bg-[#11141E] border-pink-500/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-pink-400" />
                          <span>Matched SkillForge Catalog Courses ({result.database_course_matches.length})</span>
                        </CardTitle>
                        <Badge variant="glow" size="sm">
                          Catalog Synchronized
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Courses verified in your local PostgreSQL catalog that align with this roadmap:
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {result.database_course_matches.map((c) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-lg bg-[#0A0D15] border border-[#202536] flex flex-col justify-between space-y-2"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>{c.category}</span>
                                <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1.5">
                                  {c.difficulty}
                                </Badge>
                              </div>
                              <h4 className="text-xs font-bold text-white leading-snug">
                                {c.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                Instructor: {c.instructor}
                              </p>
                            </div>
                            <Link href={`/courses/${c.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-[11px] py-1 border-[#252C42] hover:border-pink-500/40 justify-center gap-1"
                              >
                                <span>View Course Details</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-[#0C0F17] border border-[#1E2333] text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-400 block mb-0.5">Notice:</span>
                  {result.disclaimer}
                </div>
              </div>
            ) : (
              /* Idle Empty State */
              <div className="p-12 rounded-2xl bg-[#11141E] border border-dashed border-[#252C42] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Ready to Generate Your Roadmap
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input your target role and available study hours to generate an actionable, week-by-week learning syllabus.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-xs border-[#252C42]"
                >
                  Load Sample Backend Engineer Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
