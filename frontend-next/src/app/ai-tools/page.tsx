"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  FileSearch,
  Send,
  HelpCircle,
  Compass,
  ArrowRight,
  ShieldCheck,
  Cpu,
  ChevronRight,
  RefreshCw,
  Lock,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

export default function AiToolsHubPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Guard: Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/ai-tools");
    }
  }, [authLoading, isAuthenticated, router]);

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

  const aiFeatures = [
    {
      id: "resume-review",
      title: "AI Resume ATS Reviewer",
      href: "/ai-tools/resume-review",
      icon: <FileSearch className="w-6 h-6 text-pink-400" />,
      tag: "Rubric Scoring",
      badgeVariant: "pink" as const,
      description:
        "Evaluate your resume text against targeted role descriptions. Receive a holistic rubric score, identified strengths, skill gaps, and actionable bullet recommendations.",
      capabilities: [
        "0–100 Holistic Alignment Score",
        "Matching vs Missing Skills Analysis",
        "Actionable Bullet Improvements",
        "Truthful Rubric Evaluation",
      ],
      cta: "Launch Resume Reviewer",
      accentBorder: "hover:border-pink-500/50",
    },
    {
      id: "cover-letter",
      title: "AI Cover Letter Generator",
      href: "/ai-tools/cover-letter",
      icon: <Send className="w-6 h-6 text-rose-400" />,
      tag: "Fact-Anchored",
      badgeVariant: "glow" as const,
      description:
        "Draft professional, compelling cover letters strictly grounded in your provided experience facts. Never hallucinates metrics or past employers.",
      capabilities: [
        "4 Configurable Tones (Professional, Technical...)",
        "Truth-Anchored Experience Extraction",
        "Fact-Checking Verification Checklist",
        "One-Click Copy & Export",
      ],
      cta: "Draft Cover Letter",
      accentBorder: "hover:border-rose-500/50",
    },
    {
      id: "interview-prep",
      title: "Mock Interview Simulator",
      href: "/ai-tools/interview-prep",
      icon: <HelpCircle className="w-6 h-6 text-fuchsia-400" />,
      tag: "STAR Practice",
      badgeVariant: "glow" as const,
      description:
        "Generate customized mock interview prompts tailored to your target position and seniority level, complete with difficulty tiers and structured answer outlines.",
      capabilities: [
        "Technical, Behavioral & System Design",
        "Difficulty Tiers (Easy, Medium, Hard)",
        "Key Concept Breakdown & Outline",
        "Role-Specific Preparation Tips",
      ],
      cta: "Start Interview Prep",
      accentBorder: "hover:border-fuchsia-500/50",
    },
    {
      id: "career-roadmap",
      title: "Personalized Career Roadmap",
      href: "/ai-tools/career-roadmap",
      icon: <Compass className="w-6 h-6 text-pink-300" />,
      tag: "Catalog Matching",
      badgeVariant: "pink" as const,
      description:
        "Formulate a structured learning roadmap tailored to your weekly availability. Highlights skill gaps and cross-references verified courses in the SkillForge catalog.",
      capabilities: [
        "Phased Weekly Learning Timeline",
        "Hands-on Practice Project Ideas",
        "Verification Milestones & Methods",
        "Matched Real SkillForge Courses",
      ],
      cta: "Generate Roadmap",
      accentBorder: "hover:border-pink-400/50",
    },
  ];

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-pink-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-pink-400 transition-colors">
            Candidate Cockpit
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Local AI Workspace</span>
        </nav>

        {/* Hero Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#1E2333] pb-8">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2">
              <Badge variant="glow" size="sm">
                <Cpu className="w-3 h-3 text-pink-400 mr-1" />
                Local Ollama Engine
              </Badge>
              <Badge variant="outline" size="sm" className="border-pink-500/30 text-pink-300">
                Model: gemma3:4b
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-400" />
              <span>Candidate AI Career Workspace</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Open-weights intelligence running on your machine. Optimize your resume, generate authentic cover letters, practice interview prompts, and construct skill roadmaps without third-party data tracking.
            </p>
          </div>

          {/* Privacy & System Status Card */}
          <div className="p-4 rounded-xl bg-[#11141E] border border-pink-500/30 shadow-lg shadow-pink-500/5 flex flex-col gap-2 min-w-[280px]">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Private & Local</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Powered by your local Ollama runtime. Your resume and personal history never leave your computer.
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[#1D2232] text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-pink-400" /> Zero Cloud Logging
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> No API Costs
              </span>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {aiFeatures.map((tool) => (
            <Card
              key={tool.id}
              className={`bg-[#11141E] border-[#202536] ${tool.accentBorder} transition-all duration-200 flex flex-col justify-between group shadow-lg hover:shadow-pink-500/5`}
            >
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-[#171B2B] border border-[#252C42] group-hover:scale-105 transition-transform">
                    {tool.icon}
                  </div>
                  <Badge variant={tool.badgeVariant} size="sm">
                    {tool.tag}
                  </Badge>
                </div>
                <CardTitle className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                  {tool.title}
                </CardTitle>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {tool.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-5 pt-2">
                <div className="space-y-2 border-t border-[#1C2030] pt-3">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Supported Analysis:
                  </span>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                    {tool.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
                        <span className="text-[11px] text-slate-300/90">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={tool.href} className="block w-full">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-between text-xs font-semibold py-2.5"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
                  >
                    <span>{tool.cta}</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Architecture Notes */}
        <div className="p-5 rounded-2xl bg-[#0D101A] border border-[#1E2333] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-3">
            <Cpu className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-white block">
                Local Hardware Performance Note
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-3xl">
                SkillForge AI connects directly to your local FastAPI backend, which interfaces with Ollama running <code className="text-pink-300 bg-pink-500/10 px-1 py-0.5 rounded font-mono">gemma3:4b</code>. The first query after startup may take 20–60 seconds as model tensors load into system memory. Subsequent generations are significantly faster.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400 font-mono font-medium">FastAPI & Ollama Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
