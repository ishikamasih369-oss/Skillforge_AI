"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSearch,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  AlertCircle,
  Tag,
  RefreshCw,
  ArrowLeft,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
  ResumeReviewRequest,
  ResumeReviewResponse,
} from "@/lib/types/ai";

const SAMPLE_RESUME = `Alex Chen
alex.chen@example.com | (555) 234-5678 | San Francisco, CA | github.com/alexchen | linkedin.com/in/alexchen

SUMMARY
Results-oriented Full Stack Software Engineer with 2+ years of experience designing scalable microservices, RESTful APIs, and responsive React interfaces. Proficient in TypeScript, Next.js, Python, PostgreSQL, and Docker.

EXPERIENCE
Software Engineer | CloudScale Tech (June 2024 – Present)
- Architected and delivered candidate dashboard in Next.js 15 and Tailwind CSS, reducing page load latency by 38%.
- Designed 12+ RESTful microservices in FastAPI with PostgreSQL, implementing JWT authentication and Redis caching.
- Reduced database query times by 45% through composite index optimization and connection pooling in SQLAlchemy.
- Collaborated in an agile team of 6 engineers, performing code reviews and maintaining 92% test coverage with pytest.

Junior Developer | NexaBytes Studio (August 2023 – May 2024)
- Developed responsive front-end components using React, Redux Toolkit, and TypeScript for an enterprise SaaS platform.
- Implemented real-time notifications with WebSockets, supporting 15,000+ concurrent active sessions.
- Automated CI/CD pipelines using GitHub Actions and Docker, reducing deployment cycle times by 25%.

EDUCATION
B.S. in Computer Science | University of California, Berkeley (2019 – 2023)
Relevant Coursework: Data Structures & Algorithms, Distributed Systems, Database Management, Operating Systems.

SKILLS
Languages: TypeScript, JavaScript, Python, SQL, HTML5, CSS3
Frameworks & Libraries: Next.js, React, FastAPI, Node.js, Express, Tailwind CSS
Databases & Cloud: PostgreSQL, Redis, Docker, Git, Linux, GitHub Actions`;

export default function ResumeReviewPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form inputs
  const [resumeText, setResumeText] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");

  // Submission & Response states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ResumeReviewResponse | null>(null);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/ai-tools/resume-review");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validation
    const cleanResume = resumeText.trim();
    if (cleanResume.length < 50) {
      setError("Please provide at least 50 characters of resume text to evaluate.");
      return;
    }
    if (cleanResume.length > 15000) {
      setError("Resume text exceeds maximum limit of 15,000 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload: ResumeReviewRequest = {
      resume_text: cleanResume,
      target_role: targetRole.trim() ? targetRole.trim() : null,
      target_job_description: jobDescription.trim() ? jobDescription.trim() : null,
    };

    try {
      const data = await apiClient.reviewResume(payload, token);
      setReviewResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setError(
            "Local Ollama service is unavailable. Please verify that Ollama is running ('ollama serve') and model 'gemma3:4b' is downloaded."
          );
        } else if (err.status === 504) {
          setError(
            "Evaluation timed out. Local model generation may take up to 60-90 seconds on first run while loading into memory. Please retry."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred while communicating with the AI service.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setResumeText(SAMPLE_RESUME);
    setTargetRole("Full Stack Software Engineer");
    setJobDescription(
      "Looking for a Full Stack Software Engineer proficient in React, Next.js, TypeScript, Python, and PostgreSQL. Experience with Docker and microservices architecture is required."
    );
    setError(null);
  };

  const handleCopySummary = () => {
    if (!reviewResult) return;
    navigator.clipboard.writeText(
      `Resume Score: ${reviewResult.overall_score}/100\n\nSummary:\n${reviewResult.summary}\n\nStrengths:\n${reviewResult.strengths.join(
        "\n"
      )}\n\nActionable Recommendations:\n${reviewResult.actionable_recommendations.join("\n")}`
    );
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Helper for Score Styling
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 65) return "text-pink-400 border-pink-500/40 bg-pink-500/10";
    return "text-amber-400 border-amber-500/40 bg-amber-500/10";
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
          <span className="text-slate-200 font-medium">Resume Reviewer</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="pink" size="sm">
                ATS & Alignment Rubric
              </Badge>
              <Badge variant="outline" size="sm" className="text-slate-400 border-[#23283B]">
                Local Ollama Engine
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <FileSearch className="w-7 h-7 text-pink-400" />
              <span>AI Resume Reviewer</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Evaluate clarity, quantifiable achievements, and skill alignment against target role descriptions with an objective, private rubric.
            </p>
          </div>

          <Link href="/ai-tools">
            <Button variant="outline" size="sm" className="text-xs border-[#252C42]">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>All AI Tools</span>
            </Button>
          </Link>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-3.5 rounded-xl bg-[#11141E] border border-pink-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-medium">100% Private & On-Device:</strong> Your resume text is processed locally by Gemma 3. No text is logged or sent to cloud servers.
            </span>
          </div>
          <span className="text-[11px] font-mono text-pink-400/80 hidden sm:inline">
            Ollama: gemma3:4b
          </span>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-300 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white block">Evaluation Notice</span>
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

        {/* Main Grid: Form on Left / Top, Results on Right / Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Form Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Resume Content
                  </CardTitle>
                  <p className="text-[11px] text-slate-400">
                    Paste plain text of your resume
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
                  {/* Resume Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Resume Text * (Min 50 chars)
                      </label>
                      <span className={`text-[10px] font-mono ${resumeText.length < 50 ? "text-amber-400" : "text-slate-500"}`}>
                        {resumeText.length} / 15,000
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      maxLength={15000}
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here (experience, education, skills, projects)..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none font-mono leading-relaxed"
                      required
                    />
                  </div>

                  {/* Target Role Input */}
                  <Input
                    label="Target Role Title (Optional)"
                    placeholder="e.g. Senior Frontend Engineer, DevOps Intern"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  />

                  {/* Target Job Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Target Job Description (Optional)
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {jobDescription.length} / 10,000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={10000}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job posting requirements to evaluate skill match and alignment..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={isLoading || resumeText.trim().length < 50}
                      isLoading={isLoading}
                      className="w-full text-xs font-semibold py-2.5 shadow-lg shadow-pink-500/20"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      <span>{isLoading ? "Evaluating with Local AI..." : "Evaluate Resume"}</span>
                    </Button>
                    {isLoading && (
                      <p className="text-[11px] text-slate-400 text-center mt-2 animate-pulse">
                        Analyzing against rubric via local Gemma 3. This may take 20–60s on first inference...
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Evaluation Results Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="p-8 rounded-2xl bg-[#11141E] border border-[#202536] space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Evaluating Candidate Alignment
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Executing structured JSON inference on your local Ollama runtime. Analyzing quantifiable bullet impacts, clarity, and keyword coverage.
                  </p>
                </div>
                <div className="w-48 h-2 bg-[#1B2030] rounded-full mx-auto overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            ) : reviewResult ? (
              /* Review Output Display */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Score & Summary Card */}
                <Card className="bg-[#11141E] border-[#252C42]">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Holistic Evaluation Result
                      </span>
                      <CardTitle className="text-lg font-bold text-white">
                        Evaluation Summary
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopySummary}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1A2033] transition-colors"
                        title="Copy Summary"
                      >
                        {copiedSummary ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <div className={`px-4 py-2 rounded-xl border font-bold text-xl flex items-center gap-1.5 ${getScoreColor(reviewResult.overall_score)}`}>
                        <Zap className="w-4 h-4" />
                        <span>{reviewResult.overall_score}</span>
                        <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1">
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0A0D15] p-3.5 rounded-xl border border-[#1C2132]">
                      {reviewResult.summary}
                    </p>

                    <div className="p-3 rounded-lg bg-[#141826] border border-[#23283B] text-[11px] text-slate-400 leading-relaxed">
                      <strong className="text-slate-300 block mb-0.5">Scoring Rubric Clarification:</strong>
                      {reviewResult.score_explanation}
                    </div>
                  </CardContent>
                </Card>

                {/* Strengths & Areas for Improvement Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Identified Strengths ({reviewResult.strengths.length})</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {reviewResult.strengths.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                            <span className="text-[11px] leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Areas for Improvement */}
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Areas for Improvement ({reviewResult.areas_for_improvement.length})</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {reviewResult.areas_for_improvement.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            <span className="text-[11px] leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Skills Analysis Card */}
                <Card className="bg-[#11141E] border-[#202536]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-pink-400" />
                      <span>Skills Match & Gap Matrix</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Matching Skills */}
                    {reviewResult.matching_skills.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1.5">
                          Matching Skills with Target Role:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {reviewResult.matching_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing or Weak Skills */}
                    {reviewResult.missing_or_weak_skills.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider block mb-1.5">
                          Missing or Under-Represented Skills:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {reviewResult.missing_or_weak_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            >
                              ⚠ {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Identified Skills */}
                    {reviewResult.skills_identified.length > 0 && (
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                          All Skills Extracted from Resume:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {reviewResult.skills_identified.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#161B2B] text-slate-300 border border-[#252C42]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actionable Recommendations Card */}
                <Card className="bg-[#11141E] border-[#202536]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-pink-400" />
                      <span>Actionable Bullet Recommendations</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reviewResult.actionable_recommendations &&
                    reviewResult.actionable_recommendations.length > 0 ? (
                      <ol className="space-y-2.5 text-xs text-slate-300">
                        {reviewResult.actionable_recommendations.map((rec, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0A0D15] border border-[#1C2132]"
                          >
                            <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] leading-relaxed text-slate-200">
                              {rec}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="p-4 rounded-lg bg-[#0A0D15] border border-[#1C2132] text-xs text-slate-400 text-center space-y-1">
                        <p className="text-slate-300 font-medium">No Recommendations Available</p>
                        <p className="text-[11px] text-slate-500">
                          Meaningful recommendations could not be derived from this resume input. Please check the areas for improvement or refine your resume text and try again.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Disclaimer */}
                <div className="p-3.5 rounded-xl bg-[#0C0F17] border border-[#1E2333] text-[10px] text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-400 block mb-0.5">Notice:</span>
                  {reviewResult.disclaimer}
                </div>
              </div>
            ) : (
              /* Idle Empty State */
              <div className="p-12 rounded-2xl bg-[#11141E] border border-dashed border-[#252C42] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
                  <FileSearch className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Awaiting Resume Input
                  </h3>
                  <p className="text-xs text-slate-400">
                    Paste your resume and optional job description on the left, then click &quot;Evaluate Resume&quot; to inspect your score and skill matrix.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-xs border-[#252C42]"
                >
                  Fill with Sample Data
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
