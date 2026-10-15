import React from "react";
import Link from "next/link";
import { Sparkles, Terminal, ShieldCheck, Cpu } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1C2030] bg-[#07080D] text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 via-rose-500 to-fuchsia-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                SkillForge<span className="text-pink-400">AI</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full-stack learning & career acceleration platform powered by
              FastAPI, PostgreSQL, and local Ollama inference.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Local AI Engine Ready
            </div>
          </div>

          {/* Platform Columns */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#features" className="hover:text-pink-400 transition-colors">
                  Course Tracking
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-pink-400 transition-colors">
                  Internship Pipeline
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-pink-400 transition-colors">
                  Daily Goals & Streaks
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-pink-400 transition-colors">
                  Study Notes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">
              AI Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/#ai-tools" className="hover:text-pink-400 transition-colors">
                  AI Resume Reviewer
                </Link>
              </li>
              <li>
                <Link href="/#ai-tools" className="hover:text-pink-400 transition-colors">
                  AI Cover Letter Generator
                </Link>
              </li>
              <li>
                <Link href="/#ai-tools" className="hover:text-pink-400 transition-colors">
                  AI Interview Preparation
                </Link>
              </li>
              <li>
                <Link href="/#ai-tools" className="hover:text-pink-400 transition-colors">
                  Personalized Career Roadmap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-200 tracking-wider uppercase mb-3">
              Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-pink-400" />
                FastAPI REST API
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-pink-400" />
                Local Ollama (Gemma 3)
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                JWT Auth & Argon2
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1C2030] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>&copy; 2026 SkillForge AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-slate-300 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-slate-300 transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
