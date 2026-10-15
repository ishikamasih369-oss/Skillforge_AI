import React from "react";
import { Sparkles, FileSearch, Send, HelpCircle, Compass, ShieldCheck, Zap, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AiToolProps {
  id: string;
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  sampleOutput: {
    label: string;
    metrics: string;
    snippet: string;
  };
}

const aiTools: AiToolProps[] = [
  {
    id: "resume-review",
    icon: <FileSearch className="w-5 h-5 text-pink-400" />,
    badge: "ATS Optimization",
    title: "AI Resume Reviewer",
    description: "Deep bullet-point analysis, ATS keyword scoring, and high-impact phrasing recommendations.",
    sampleOutput: {
      label: "ATS Match Score: 88/100",
      metrics: "+3 Quantified Impact Fixes",
      snippet: '"Replaced passive description with: Scaled FastAPI microservice reducing p95 latency by 34% across 10k requests."',
    },
  },
  {
    id: "cover-letter",
    icon: <Send className="w-5 h-5 text-rose-400" />,
    badge: "High Conversion",
    title: "Tailored Cover Letter Generator",
    description: "Generates authentic, role-aligned letters matching the target company's culture and specific job requirements.",
    sampleOutput: {
      label: "Role Alignment: Principal Match",
      metrics: "Customized for Target Stack",
      snippet: '"My experience building concurrent data pipelines with PostgreSQL and Docker maps directly to your Platform Team mission..."',
    },
  },
  {
    id: "interview-prep",
    icon: <HelpCircle className="w-5 h-5 text-fuchsia-400" />,
    badge: "Technical & Behavioral",
    title: "Interview Question Simulator",
    description: "Role-specific technical challenges, architectural system design queries, and STAR-format behavioral questions.",
    sampleOutput: {
      label: "Difficulty: Mid-Senior SWE",
      metrics: "5 Targeted Questions Generated",
      snippet: '"Q: How would you design rate-limiting with distributed Redis token buckets to handle flash traffic spikes?"',
    },
  },
  {
    id: "career-roadmap",
    icon: <Compass className="w-5 h-5 text-pink-300" />,
    badge: "Milestone Planner",
    title: "Career Roadmap Architect",
    description: "Personalized step-by-step career milestones from junior foundation to engineering leadership.",
    sampleOutput: {
      label: "Timeline: 12-Week Sprint",
      metrics: "4 Phased Milestones",
      snippet: '"Phase 2: Master Distributed Caching, Connection Pooling, and Asynchronous Task Queues with Celery."',
    },
  },
];

export function AiSuiteSection() {
  return (
    <section id="ai-tools" className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-[#1C2132]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="glow" className="mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-pink-400" />
            Local AI Engine &bull; Ollama Powered
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Four specialized AI tools built for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400">
              real career outcomes
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Harness the power of local LLM inference. No expensive cloud tokens, no quota limits, and 100% private data that never leaves your machine.
          </p>

          {/* Privacy & Speed pill banner */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2 px-4 rounded-full bg-[#11141E] border border-[#202536] text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-pink-400" />
              100% Local Inference
            </span>
            <span className="text-[#202536]">&bull;</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Zero Data Leakage
            </span>
            <span className="text-[#202536]">&bull;</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              Validated JSON Schema
            </span>
          </div>
        </div>

        {/* 4 Tool Cards with Sample Outputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {aiTools.map((tool) => (
            <Card
              key={tool.id}
              className="bg-[#11141E]/90 border-[#202536] hover:border-pink-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                    {tool.icon}
                  </div>
                  <Badge variant="outline" className="text-xs text-pink-300/80 border-pink-500/20">
                    {tool.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white">
                  {tool.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                {/* Simulated AI Output Card */}
                <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1C2132] font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-[#1C2132] pb-2">
                    <span className="text-pink-400 font-semibold">{tool.sampleOutput.label}</span>
                    <span className="text-slate-400">{tool.sampleOutput.metrics}</span>
                  </div>
                  <p className="text-slate-300 font-sans italic text-xs leading-relaxed">
                    {tool.sampleOutput.snippet}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
