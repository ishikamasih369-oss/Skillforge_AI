import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 border-t border-[#1C2132]">
      <div className="max-w-5xl mx-auto relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-fuchsia-500/10 blur-2xl rounded-3xl -z-10" />

        <div className="rounded-3xl bg-[#11141E] border border-pink-500/20 p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
          {/* Subtle decorative mesh elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-semibold text-pink-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack AI Career Accelerator</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Level up your engineering career with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400">
                SkillForge AI
              </span>
            </h2>

            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Track your coursework, manage your internship applications, and optimize your resume and interview preparation with private local AI inference.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto font-semibold">
                  <span>Get Started Now</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto font-semibold">
                  <Terminal className="w-4 h-4 mr-2 text-pink-400" />
                  <span>Explore Dashboard</span>
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              No credit card required &bull; 100% private local Ollama AI &bull; Open-source architecture
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
