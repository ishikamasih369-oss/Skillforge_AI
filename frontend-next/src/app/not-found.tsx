import React from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center mb-6">
          <Sparkles className="w-6 h-6" />
        </div>

        <span className="text-pink-400 font-mono text-sm font-semibold tracking-wider uppercase">
          404 &bull; Page Not Found
        </span>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 tracking-tight">
          Lost in the skill matrix?
        </h1>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          The page or module you requested doesn&apos;t exist or has moved. Return to the main portal to continue your preparation.
        </p>

        <Link href="/">
          <Button variant="primary" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>Return to SkillForge AI</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
