import React from "react";
import { BookOpen, Briefcase, Target, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface FeatureCardProps {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

const features: FeatureCardProps[] = [
  {
    icon: <BookOpen className="w-5 h-5 text-pink-400" />,
    badge: "Curriculum",
    title: "Course & Skill Tracker",
    description: "Systematically track your technical coursework, chapters, and competencies with precise percent-complete metrics.",
    highlights: [
      "Structured milestones & chapter-level progress",
      "Categorized by Core CS, Web, Systems & AI",
      "Interactive status toggles (In Progress, Done)",
    ],
  },
  {
    icon: <Briefcase className="w-5 h-5 text-rose-400" />,
    badge: "Career Pipeline",
    title: "Internship Application Pipeline",
    description: "Organize every opportunity through a focused Kanban-ready workflow from initial wishlist to signing your offer.",
    highlights: [
      "Status tracking: Applied, Screening, Interview, Offer",
      "Deadline tracking with proactive alert badges",
      "Compensation, location, and role metadata logged",
    ],
  },
  {
    icon: <Target className="w-5 h-5 text-fuchsia-400" />,
    badge: "Discipline",
    title: "Daily Goals & Streaks",
    description: "Cultivate relentless technical consistency with prioritized micro-goals and unbroken streak tracking.",
    highlights: [
      "Active streak counter to preserve learning momentum",
      "Target completion dates with urgency markers",
      "One-click completion checks with instant feedback",
    ],
  },
  {
    icon: <FileText className="w-5 h-5 text-pink-300" />,
    badge: "Knowledge Base",
    title: "Structured Study Notes",
    description: "Capture algorithmic patterns, system design trade-offs, and behavioral anecdotes linked to your learning goals.",
    highlights: [
      "Categorized notes tagged by course and interview topic",
      "Quick-search capability across all study summaries",
      "Fast reference when reviewing 30 minutes before interviews",
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 border-t border-[#1C2132]">
      {/* Background glow accent */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="pink" className="mb-4">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything ambitious engineers need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400">
              stand out
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Stop juggling fragmented spreadsheets, bookmarks, and disjointed notes. SkillForge AI brings your entire career preparation cycle into one unified workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              glowOnHover
              className="group bg-[#11141E]/80 backdrop-blur-sm border-[#202536] hover:border-pink-500/40 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:scale-105 group-hover:border-pink-500/40 transition-all">
                    {feature.icon}
                  </div>
                  <Badge variant="outline" className="text-xs text-slate-400 border-[#252B3D]">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors">
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm leading-relaxed mt-1">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ul className="space-y-2.5">
                  {feature.highlights.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-start text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-pink-400 mr-2.5 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature summary callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#11141E] via-[#161B29] to-[#11141E] border border-[#252B3D] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-white">Ready to streamline your preparation?</h3>
            <p className="text-sm text-slate-400 mt-1">
              Explore your personal development workspace and see all metrics in one place.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1F2538] hover:bg-pink-500/20 text-white hover:text-pink-300 text-sm font-semibold border border-[#2C344E] hover:border-pink-500/30 transition-all group shrink-0"
          >
            <span>Preview Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
