import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, Bot, BookOpen, Briefcase, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-pink-600/10 via-rose-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center justify-center mb-6">
          <Badge variant="glow" size="md">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Next-Gen Full-Stack Career Suite</span>
          </Badge>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Master Skills. Prepare with AI.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400">
            Get Hired.
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          SkillForge AI brings together structured course tracking, internship pipeline
          management, and local AI career tools—designed for software development students.
        </p>

        {/* Hero Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto shadow-lg shadow-pink-500/25"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Free Today
            </Button>
          </Link>
          <Link href="#ai-tools" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Explore AI Tools
            </Button>
          </Link>
        </div>

        {/* Trust Points */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Private Local AI Inference (Ollama)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Structured JSON Outputs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Zero Subscription Fees</span>
          </div>
        </div>

        {/* Hero UI Showcase / Mockup Preview */}
        <div className="mt-14 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-[#23283B] bg-[#0E111B]/95 p-3 sm:p-5 shadow-2xl shadow-black/80 text-left">
            {/* Window Topbar */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1B2030] text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-2 font-mono text-[11px] text-slate-400">
                  skillforge-ai.local/dashboard
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                <Bot className="w-3 h-3" /> Local Gemma 3 Active
              </div>
            </div>

            {/* Dashboard Mockup Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Card 1: Resume Review Score */}
              <div className="rounded-xl border border-[#1D2233] bg-[#131724] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/15 flex items-center justify-center text-pink-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-white">Resume Review</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    88 / 100
                  </span>
                </div>
                <div className="my-3 space-y-1.5 text-[11px]">
                  <p className="text-slate-300 font-medium">Strengths identified:</p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    FastAPI REST endpoints & JWT auth
                  </p>
                  <p className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    PostgreSQL relational schema modeling
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1C2030] flex items-center justify-between text-[11px] text-slate-400">
                  <span>ATS Rubric Evaluation</span>
                  <span className="text-pink-400 font-medium">Ready</span>
                </div>
              </div>

              {/* Card 2: Internship Pipeline */}
              <div className="rounded-xl border border-[#1D2233] bg-[#131724] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-rose-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-white">Internship Tracker</span>
                  </div>
                  <span className="text-[11px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    4 Active
                  </span>
                </div>
                <div className="my-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between p-1.5 rounded bg-[#0E111B] border border-[#1A1F2E]">
                    <span className="font-medium text-slate-200">CloudScale SWE</span>
                    <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
                      Interview
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded bg-[#0E111B] border border-[#1A1F2E]">
                    <span className="font-medium text-slate-200">DataTech Backend</span>
                    <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px]">
                      Assessment
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#1C2030] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Application Stages</span>
                  <span className="text-emerald-400">1 Selected</span>
                </div>
              </div>

              {/* Card 3: Daily Goal & Course Streak */}
              <div className="rounded-xl border border-[#1D2233] bg-[#131724] p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                      <Flame className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-white">Study Streak</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    7 Days 🔥
                  </span>
                </div>
                <div className="my-3 space-y-2 text-[11px]">
                  <div className="flex justify-between text-slate-300">
                    <span>Daily Goal (60m)</span>
                    <span className="font-medium text-white">45m (75%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1C2132] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full w-[75%]" />
                  </div>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <BookOpen className="w-3 h-3 text-pink-400" />
                    Currently studying: Python & FastAPI Bootcamp
                  </p>
                </div>
                <div className="pt-2 border-t border-[#1C2030] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Goal Status</span>
                  <span className="text-slate-200">15m remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
