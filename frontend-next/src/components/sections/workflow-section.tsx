import React from "react";
import { Layers, Bot, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StepItem {
  number: string;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  description: string;
  pill: string;
}

const steps: StepItem[] = [
  {
    number: "01",
    icon: <Layers className="w-6 h-6 text-pink-400" />,
    title: "Structure Your Learning",
    tagline: "Build foundational & advanced skills",
    description: "Organize CS coursework, frameworks, and system design topics with chapter progress and daily habit streaks.",
    pill: "Coursework & Daily Goals",
  },
  {
    number: "02",
    icon: <Bot className="w-6 h-6 text-rose-400" />,
    title: "Synthesize With Local AI",
    tagline: "Private, instantaneous career prep",
    description: "Audit your resume against ATS criteria, tailor persuasive cover letters, and generate realistic interview questions with zero cloud exposure.",
    pill: "Local Ollama LLM Inference",
  },
  {
    number: "03",
    icon: <Trophy className="w-6 h-6 text-fuchsia-400" />,
    title: "Track Pipeline & Land Offers",
    tagline: "Turn applications into offers",
    description: "Manage applications through every stage of the pipeline with deadlines, compensation notes, and interview prep in one single cockpit.",
    pill: "Full Lifecycle Kanban Pipeline",
  },
];

export function WorkflowSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-[#1C2132]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="pink" className="mb-4">
            Workflow Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            From first semester study session to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400">
              first software engineer offer
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            A cohesive three-step operating system designed to turn raw effort into reproducible career outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-pink-500/20 via-rose-500/30 to-fuchsia-500/20 -translate-y-12 z-0" />

          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative z-10 flex flex-col p-6 sm:p-8 rounded-2xl bg-[#11141E]/80 backdrop-blur-sm border border-[#202536] hover:border-pink-500/40 transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-pink-500/40 transition-all">
                  {step.icon}
                </div>
                <span className="text-3xl font-extrabold text-slate-600/70 font-mono group-hover:text-pink-400/80 transition-colors">
                  {step.number}
                </span>
              </div>

              <div className="mb-2">
                <span className="text-xs font-semibold text-pink-400 tracking-wider uppercase">
                  {step.tagline}
                </span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">
                {step.title}
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed mb-6 flex-grow">
                {step.description}
              </p>

              <div className="pt-4 border-t border-[#1C2132] mt-auto">
                <span className="inline-flex items-center text-xs font-medium text-slate-300 bg-[#090A0F] px-3 py-1.5 rounded-md border border-[#1C2132]">
                  {step.pill}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
