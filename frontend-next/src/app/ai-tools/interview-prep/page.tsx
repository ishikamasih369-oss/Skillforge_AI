"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Layers,
  BrainCircuit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
  InterviewExperienceLevel,
  InterviewQuestionsRequest,
  InterviewQuestionsResponse,
  InterviewType,
  QuestionDifficulty,
} from "@/lib/types/ai";

const EXPERIENCE_LEVELS: InterviewExperienceLevel[] = [
  "Entry-level / Intern",
  "Junior",
  "Mid-level",
  "Senior",
];

const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "mixed", label: "Mixed (Technical & Behavioral)" },
  { value: "technical", label: "Technical & Algorithms" },
  { value: "system_design", label: "System Design & Architecture" },
  { value: "behavioral", label: "Behavioral & Leadership" },
];

export default function InterviewPrepPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form inputs
  const [targetRole, setTargetRole] = useState<string>("");
  const [experienceLevel, setExperienceLevel] =
    useState<InterviewExperienceLevel>("Entry-level / Intern");
  const [interviewType, setInterviewType] = useState<InterviewType>("mixed");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [skillsInput, setSkillsInput] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewQuestionsResponse | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/ai-tools/interview-prep");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (targetRole.trim().length < 2) {
      setError("Please specify a target role (at least 2 characters).");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Parse comma-separated skills
    const skillsList = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 15);

    const payload: InterviewQuestionsRequest = {
      target_role: targetRole.trim(),
      experience_level: experienceLevel,
      interview_type: interviewType,
      num_questions: numQuestions,
      skills_or_topics: skillsList.length > 0 ? skillsList : null,
      job_description: jobDescription.trim() ? jobDescription.trim() : null,
    };

    try {
      const data = await apiClient.generateInterviewQuestions(payload, token);
      setResult(data);
      if (data.questions && data.questions.length > 0) {
        setExpandedId(data.questions[0].id);
      } else {
        setError(
          "The local model did not produce questions for this configuration. Please try adjusting your parameters or retrying."
        );
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setError(
            "Local Ollama service is unavailable. Please verify that Ollama is running ('ollama serve') and model 'gemma3:4b' is downloaded."
          );
        } else if (err.status === 504) {
          setError(
            "Question generation timed out. Local models may take 60-90 seconds on first inference. Please retry."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to generate interview questions. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setTargetRole("Full Stack Software Engineer");
    setExperienceLevel("Entry-level / Intern");
    setInterviewType("mixed");
    setNumQuestions(5);
    setSkillsInput("React, Next.js, Python, PostgreSQL, Redis, REST APIs");
    setJobDescription(
      "Looking for engineers with strong problem-solving skills, experience with RESTful microservices, and React frontends."
    );
    setError(null);
  };

  const toggleExpand = (id: number) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text = result.questions
      .map(
        (q, idx) =>
          `Q${idx + 1} [${q.difficulty} - ${q.category}]: ${q.question}\nKey Concepts: ${q.key_concepts.join(
            ", "
          )}\nSample Outline:\n${q.sample_answer_outline.map((o) => `  - ${o}`).join("\n")}`
      )
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Helper for Difficulty Badge
  const renderDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case "Easy":
        return <Badge variant="success" size="sm">Easy</Badge>;
      case "Medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
            Medium
          </span>
        );
      case "Hard":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Hard
          </span>
        );
      default:
        return <Badge variant="outline" size="sm">{diff}</Badge>;
    }
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
          <span className="text-slate-200 font-medium">Interview Simulator</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="glow" size="sm">
                STAR & Technical Practice
              </Badge>
              <Badge variant="outline" size="sm" className="text-slate-400 border-[#23283B]">
                Local Ollama Engine
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <HelpCircle className="w-7 h-7 text-fuchsia-400" />
              <span>AI Interview Question Simulator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Simulate technical, behavioral, and architectural interview questions tailored to your exact seniority level, complete with answer frameworks.
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
        <div className="p-3.5 rounded-xl bg-[#11141E] border border-fuchsia-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-medium">Private Mock Preparation:</strong> All question generation and practice analysis runs locally on your machine.
            </span>
          </div>
          <span className="text-[11px] font-mono text-fuchsia-400/80 hidden sm:inline">
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

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Column (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Interview Criteria
                  </CardTitle>
                  <p className="text-[11px] text-slate-400">
                    Target role, difficulty level, and topics
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 py-0.5 px-2"
                >
                  Load Sample
                </Button>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Target Role *"
                    placeholder="e.g. Full Stack Engineer, Cloud Architect"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    required
                  />

                  {/* Seniority Level */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Seniority / Experience Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXPERIENCE_LEVELS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setExperienceLevel(level)}
                          className={`p-2 rounded-lg border text-left text-xs transition-all ${
                            experienceLevel === level
                              ? "bg-fuchsia-500/15 border-fuchsia-500 text-white font-medium ring-1 ring-fuchsia-500/50"
                              : "bg-[#0A0D15] border-[#202536] text-slate-400 hover:text-white"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Interview Type */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Interview Focus Type
                    </label>
                    <select
                      value={interviewType}
                      onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs py-2 px-3 focus:outline-none focus:border-fuchsia-500"
                    >
                      {INTERVIEW_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Number of Questions */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Number of Questions: <strong className="text-fuchsia-400">{numQuestions}</strong>
                      </label>
                      <span className="text-[10px] text-slate-500">Range: 1 – 15</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Number(e.target.value))}
                      className="w-full accent-fuchsia-500"
                    />
                  </div>

                  {/* Skills / Topics */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Key Skills / Topics (Comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. React, Python, PostgreSQL, Redis"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs py-2 px-3 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500"
                    />
                  </div>

                  {/* Optional Job Description */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300">
                      Job Description Snippet (Optional)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={8000}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste specific job requirements for tailored questions..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-fuchsia-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isLoading || targetRole.trim().length < 2}
                      isLoading={isLoading}
                      className="w-full text-xs font-semibold py-2.5 shadow-lg shadow-fuchsia-500/20 bg-gradient-to-r from-fuchsia-500 via-rose-500 to-pink-500"
                    >
                      <BrainCircuit className="w-4 h-4 mr-1.5" />
                      <span>{isLoading ? "Generating Questions..." : "Generate Practice Questions"}</span>
                    </Button>
                    {isLoading && (
                      <p className="text-[11px] text-slate-400 text-center mt-2 animate-pulse">
                        Simulating customized interview prompts via local Gemma 3 (20-60s)...
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
                <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mx-auto animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Curating Interview Prompts
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Formulating structured questions, difficulty tiers, key concepts, and sample answer outlines on your local Ollama runtime.
                  </p>
                </div>
              </div>
            ) : result ? (
              /* Questions Output */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Meta Bar */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#11141E] border border-[#202536]">
                  <div>
                    <span className="text-[11px] font-semibold text-fuchsia-400 uppercase tracking-wider block">
                      Generated Practice Session
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {result.questions.length} Questions for {result.target_role}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Level: {result.experience_level} • Type: {result.interview_type}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="text-xs border-[#252C42]"
                  >
                    {copiedAll ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Questions List */}
                {result.questions && result.questions.length > 0 ? (
                  <div className="space-y-3">
                    {result.questions.map((q, idx) => {
                      const isExpanded = expandedId === q.id;
                      return (
                        <Card
                          key={q.id || idx}
                          className="bg-[#11141E] border-[#202536] hover:border-[#2E374E] transition-all"
                        >
                          <CardHeader
                            onClick={() => toggleExpand(q.id)}
                            className="p-4 cursor-pointer select-none space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-fuchsia-500/20 text-fuchsia-300 text-xs font-bold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <Badge variant="outline" size="sm" className="border-[#252C42] text-slate-300">
                                  {q.category}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                {renderDifficultyBadge(q.difficulty)}
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                            </div>

                            <CardTitle className="text-sm font-semibold text-white leading-snug">
                              {q.question}
                            </CardTitle>

                            {/* Key Concepts Preview */}
                            {q.key_concepts.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {q.key_concepts.map((concept, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="text-[10px] px-2 py-0.5 rounded bg-[#0A0D15] text-slate-400 border border-[#1C2132]"
                                  >
                                    {concept}
                                  </span>
                                ))}
                              </div>
                            )}
                          </CardHeader>

                          {/* Expandable Answer Outline */}
                          {isExpanded && (
                            <CardContent className="pt-0 pb-4 px-4 border-t border-[#1C2030] space-y-3">
                              <div className="pt-3">
                                <span className="text-[11px] font-semibold text-fuchsia-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Sample Answer Structure & STAR Outline:</span>
                                </span>
                                <ul className="space-y-1.5 text-xs text-slate-300">
                                  {q.sample_answer_outline.map((point, pIdx) => (
                                    <li
                                      key={pIdx}
                                      className="flex items-start gap-2 p-2 rounded-lg bg-[#0A0D15] border border-[#191E2C]"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 shrink-0 mt-1.5" />
                                      <span className="text-[11px] text-slate-200 leading-relaxed">
                                        {point}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-[#11141E] border border-[#202536] text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-semibold text-white">No Questions Produced</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      The local AI model did not produce questions for this configuration. Please check your role title and topic keywords, then try again.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSubmit}
                      className="text-xs border-[#252C42]"
                    >
                      Retry Generation
                    </Button>
                  </div>
                )}

                {/* Preparation Tips Card */}
                {result.preparation_tips.length > 0 && (
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-fuchsia-400" />
                        <span>Tactical Interview Preparation Tips</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {result.preparation_tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] leading-relaxed text-slate-300">
                              {tip}
                            </span>
                          </li>
                        ))}
                      </ul>
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
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mx-auto">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Ready to Generate Mock Prompts
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure your desired role and interview type on the left, then click &quot;Generate Practice Questions&quot;.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-xs border-[#252C42]"
                >
                  Load Sample Full Stack Prompts
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
