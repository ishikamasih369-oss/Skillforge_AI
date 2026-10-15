"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  FileText,
  Sliders,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
  CoverLetterRequest,
  CoverLetterResponse,
  CoverLetterTone,
} from "@/lib/types/ai";

const SAMPLE_EXPERIENCE = `Full Stack Engineer with 2.5 years of experience building modern web apps.
- Spearheaded Next.js 15 migration reducing frontend bundle size by 35%.
- Built high-throughput REST APIs in FastAPI with PostgreSQL, serving 50k daily requests.
- Implemented real-time dashboard analytics with WebSockets and Tailwind CSS.
- Maintained 90%+ unit test coverage with pytest and Vitest.
Education: B.S. in Computer Science from UC Berkeley.`;

const SAMPLE_JOB_DESC = `Stripe is looking for a Software Engineering Intern to join our Developer Infrastructure team.
Responsibilities:
- Build developer tooling, internal microservices, and high-performance APIs.
- Collaborate with engineers across systems in Python, Go, or TypeScript.
- Improve build times, test infrastructure, and developer experience.
Requirements:
- Solid understanding of web fundamentals, data structures, and algorithms.
- Hands-on experience with modern frameworks like React, Next.js, and Python.
- Passion for developer velocity, code reliability, and scalable architectures.`;

const TONE_OPTIONS: { value: CoverLetterTone; label: string; desc: string }[] = [
  { value: "professional", label: "Professional", desc: "Balanced, polished, industry-standard" },
  { value: "enthusiastic", label: "Enthusiastic", desc: "High energy, mission-driven passion" },
  { value: "technical", label: "Technical", desc: "Emphasizes architecture & engineering metrics" },
  { value: "concise", label: "Concise", desc: "Short, direct, high-impact bullets" },
];

export default function CoverLetterPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Form inputs
  const [targetRole, setTargetRole] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [experienceSummary, setExperienceSummary] = useState<string>("");
  const [tone, setTone] = useState<CoverLetterTone>("professional");

  // Output states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/ai-tools/cover-letter");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (targetRole.trim().length < 2) {
      setError("Please provide a valid target role (at least 2 characters).");
      return;
    }
    if (companyName.trim().length < 2) {
      setError("Please provide a company name (at least 2 characters).");
      return;
    }
    if (jobDescription.trim().length < 20) {
      setError("Job description must be at least 20 characters long.");
      return;
    }
    if (experienceSummary.trim().length < 20) {
      setError("Experience summary must be at least 20 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload: CoverLetterRequest = {
      target_role: targetRole.trim(),
      company_name: companyName.trim(),
      job_description: jobDescription.trim(),
      experience_summary: experienceSummary.trim(),
      tone,
    };

    try {
      const data = await apiClient.generateCoverLetter(payload, token);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 503) {
          setError(
            "Local Ollama service is unavailable. Please verify that Ollama is running ('ollama serve') and model 'gemma3:4b' is downloaded."
          );
        } else if (err.status === 504) {
          setError(
            "Generation timed out. Local inference may take up to 60-90 seconds on first run. Please retry."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to generate cover letter. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadSample = () => {
    setTargetRole("Software Engineering Intern");
    setCompanyName("Stripe");
    setJobDescription(SAMPLE_JOB_DESC);
    setExperienceSummary(SAMPLE_EXPERIENCE);
    setTone("technical");
    setError(null);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.cover_letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
          <span className="text-slate-200 font-medium">Cover Letter Generator</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="glow" size="sm">
                Fact-Anchored Generation
              </Badge>
              <Badge variant="outline" size="sm" className="text-slate-400 border-[#23283B]">
                Local Ollama Engine
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Send className="w-7 h-7 text-rose-400" />
              <span>AI Cover Letter Generator</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Draft authentic, role-aligned cover letters grounded strictly in your verified experiences. Never fabricates employers or claims.
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
        <div className="p-3.5 rounded-xl bg-[#11141E] border border-rose-500/20 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-medium">Strict On-Device Privacy:</strong> Candidate details and company notes are never logged or stored in third-party databases.
            </span>
          </div>
          <span className="text-[11px] font-mono text-rose-400/80 hidden sm:inline">
            Model: gemma3:4b
          </span>
        </div>

        {/* Global Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3 text-xs text-rose-300 animate-in fade-in"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
                    Target Role & Experience
                  </CardTitle>
                  <p className="text-[11px] text-slate-400">
                    Input job parameters and your true background
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-[11px] text-rose-400 hover:text-rose-300 py-0.5 px-2"
                >
                  Load Sample
                </Button>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Target Role *"
                      placeholder="e.g. Backend Engineering Intern"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      required
                    />
                    <Input
                      label="Company Name *"
                      placeholder="e.g. Stripe, Airbnb"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-rose-400" />
                      <span>Writing Tone</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TONE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTone(opt.value)}
                          className={`p-2 rounded-lg border text-left transition-all ${
                            tone === opt.value
                              ? "bg-rose-500/15 border-rose-500 text-white ring-1 ring-rose-500/50"
                              : "bg-[#0A0D15] border-[#202536] text-slate-400 hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-semibold block">{opt.label}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Job Posting Description * (Min 20 chars)
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">
                        {jobDescription.length} / 10,000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={10000}
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste key requirements, stack, and responsibilities from the job listing..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 resize-none leading-relaxed"
                      required
                    />
                  </div>

                  {/* Experience Summary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-300">
                        Your Real Experience & Bullets * (Min 20 chars)
                      </label>
                      <span className="text-[10px] font-mono text-slate-500">
                        {experienceSummary.length} / 15,000
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      maxLength={15000}
                      value={experienceSummary}
                      onChange={(e) => setExperienceSummary(e.target.value)}
                      placeholder="Paste your resume summary, project milestones, or specific accomplishments to anchor the letter..."
                      className="w-full rounded-lg bg-[#0A0D15] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 resize-none font-mono leading-relaxed"
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={
                        isLoading ||
                        targetRole.trim().length < 2 ||
                        companyName.trim().length < 2 ||
                        jobDescription.trim().length < 20 ||
                        experienceSummary.trim().length < 20
                      }
                      isLoading={isLoading}
                      className="w-full text-xs font-semibold py-2.5 shadow-lg shadow-rose-500/20 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-600"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      <span>{isLoading ? "Generating with Local Model..." : "Draft Cover Letter"}</span>
                    </Button>
                    {isLoading && (
                      <p className="text-[11px] text-slate-400 text-center mt-2 animate-pulse">
                        Drafting letter anchored in your experience facts via local Gemma 3 (20-60s)...
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
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto animate-pulse">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Drafting Personalized Letter
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Connecting to local Ollama runtime. Structuring opening narrative, experience highlights, and company-specific alignment without fabricating past achievements.
                  </p>
                </div>
              </div>
            ) : result ? (
              /* Generated Output */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Editor Panel Card */}
                <Card className="bg-[#11141E] border-[#252C42]">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                        Tailored Cover Letter
                      </span>
                      <CardTitle className="text-base font-bold text-white">
                        {result.target_role} at {result.company_name}
                      </CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="text-xs border-[#252C42] gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Letter</span>
                        </>
                      )}
                    </Button>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1">
                    <div className="bg-[#0A0D15] p-5 rounded-xl border border-[#1E2333]">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans selection:bg-rose-500 selection:text-white">
                        {result.cover_letter}
                      </p>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      Note: This letter was generated locally in memory and is not persisted in the database.
                    </p>
                  </CardContent>
                </Card>

                {/* Verification Checklist Card */}
                {result.verification_checklist.length > 0 && (
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-rose-400" />
                        <span>Pre-Submission Verification Checklist</span>
                      </CardTitle>
                      <p className="text-[11px] text-slate-400">
                        Review these specific claims and dates for complete accuracy before sending:
                      </p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {result.verification_checklist.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#0A0D15] border border-[#1C2132]"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                            <span className="text-[11px] text-slate-200 leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Key Highlights Used Card */}
                {result.key_highlights_used.length > 0 && (
                  <Card className="bg-[#11141E] border-[#202536]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>Key Experience Highlights Truthfully Extracted</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {result.key_highlights_used.map((highlight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-[11px] text-slate-300 leading-relaxed">
                              {highlight}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Idle Empty State */
              <div className="p-12 rounded-2xl bg-[#11141E] border border-dashed border-[#252C42] text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                  <Send className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-sm mx-auto">
                  <h3 className="text-base font-bold text-white">
                    Awaiting Target Parameters
                  </h3>
                  <p className="text-xs text-slate-400">
                    Input your target role, company, job requirements, and past accomplishments to draft a tailored cover letter.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="text-xs border-[#252C42]"
                >
                  Load Sample Stripe Candidate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
