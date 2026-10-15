"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  Briefcase,
  Target,
  FileSearch,
  Send,
  HelpCircle,
  Compass,
  Clock,
  LogOut,
  RefreshCw,
  AlertCircle,
  StickyNote,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type { DashboardSummary } from "@/lib/types/auth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "overview" | "courses" | "goals" | "internships" | "notes" | "ai-tools"
  >("overview");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Protected route guard: Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load of dashboard statistics
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated || !token) return;

    apiClient
      .getDashboardSummary(token)
      .then((data) => {
        if (!ignore) {
          setSummary(data);
          setSummaryError(null);
          setIsSummaryLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setSummaryError(err.message);
          } else {
            setSummaryError("Failed to load dashboard statistics from backend.");
          }
          setIsSummaryLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  // Explicit user-triggered refresh
  const handleRefresh = useCallback(async () => {
    if (!token) return;
    setIsSummaryLoading(true);
    setSummaryError(null);

    try {
      const data = await apiClient.getDashboardSummary(token);
      setSummary(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setSummaryError(err.message);
      } else {
        setSummaryError("Failed to load dashboard statistics from backend.");
      }
    } finally {
      setIsSummaryLoading(false);
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // Loading Screen while verifying authentication
  if (authLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/25 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
          <span>Authenticating Candidate Session...</span>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SF";

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#1C2132] bg-[#090A0F]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-lg p-1"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/20 group-hover:scale-105 transition-all">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Skill<span className="text-pink-400">Forge</span> AI
              </span>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === "overview"
                    ? "bg-pink-500/10 text-pink-300 border border-pink-500/20"
                    : "text-slate-400 hover:text-white hover:bg-[#141824]"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <Link
                href="/courses"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Courses</span>
              </Link>

              <Link
                href="/goals"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Goals</span>
              </Link>

              {(
                [
                  { id: "internships", label: "Internships", icon: Briefcase },
                  { id: "notes", label: "Notes", icon: StickyNote },
                  { id: "ai-tools", label: "AI Tools", icon: Zap },
                ] as const
              ).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? "bg-pink-500/10 text-pink-300 border border-pink-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#141824]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/40 flex items-center justify-center text-xs font-bold text-pink-300">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left text-xs">
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {user?.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[140px]">
                  {user?.email}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 ml-1"
                title="Sign out of SkillForge"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-[#1C2132] overflow-x-auto scrollbar-none">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "courses", label: "Courses" },
              { id: "goals", label: "Goals" },
              { id: "internships", label: "Internships" },
              { id: "notes", label: "Notes" },
              { id: "ai-tools", label: "AI Tools" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-pink-500/10 text-pink-300 border border-pink-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111420] via-[#141828] to-[#121624] border border-[#202538] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="glow" className="text-xs">
                Authenticated Session
              </Badge>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                PostgreSQL User #{user?.id}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-pink-400">{user?.name}</span>!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Your real candidate metrics are synchronized directly with the FastAPI backend. Track courses, internship pipeline updates, daily goals, and private AI tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isSummaryLoading}
              className="text-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${
                  isSummaryLoading ? "animate-spin text-pink-400" : ""
                }`}
              />
              <span>Refresh Stats</span>
            </Button>
            <Link href="/ai-tools">
              <Button variant="primary" size="sm" className="text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                <span>Explore AI Suite</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Specific Content Warning if navigating away from Overview */}
        {activeTab !== "overview" && (
          <div className="p-4 rounded-xl bg-[#11141E] border border-pink-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white capitalize">
                  {activeTab} Module (Scheduled for Future Phase)
                </p>
                <p className="text-[11px] text-slate-400">
                  Authentication and live API synchronization are completed in Phase 2. Specialized CRUD interfaces for {activeTab} will be wired in upcoming phases.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("overview")}
              className="text-xs border-[#23283B]"
            >
              Back to Overview
            </Button>
          </div>
        )}

        {/* API Error Notification if summary fetch failed */}
        {summaryError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs text-rose-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold block text-white">Failed to load real dashboard metrics</span>
                <span>{summaryError}</span>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleRefresh}
              className="text-xs shrink-0"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Real Live Metrics Row (from GET /api/dashboard/summary) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-pink-400" />
              <span>Real Live Activity Summary</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Live from GET /api/dashboard/summary
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Courses Metric Card */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Courses Enrolled</span>
                  <BookOpen className="w-4 h-4 text-pink-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mt-1">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-6 bg-[#1A1F30] rounded animate-pulse" />
                  ) : (
                    `${summary?.courses.enrolled ?? 0} Enrolled`
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400">
                  {isSummaryLoading
                    ? "Calculating completion..."
                    : summary && summary.courses.enrolled > 0
                    ? `${summary.courses.completed} of ${summary.courses.enrolled} courses completed`
                    : "No course enrollments in database yet"}
                </p>
                <Link
                  href="/courses/my-courses"
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>View Enrolled Courses</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Applications Metric Card */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Internship Applications</span>
                  <Briefcase className="w-4 h-4 text-rose-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mt-1">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-6 bg-[#1A1F30] rounded animate-pulse" />
                  ) : (
                    `${summary?.internships.total ?? 0} Tracked`
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400">
                  {isSummaryLoading
                    ? "Scanning pipeline..."
                    : summary && summary.internships.total > 0
                    ? `${summary.internships.Interview} Interviewing • ${summary.internships.Selected} Selected`
                    : "No internships logged in database yet"}
                </p>
                <Link
                  href="/internships"
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>Open Pipeline Tracker</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Daily Goal Metric Card */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Today&apos;s Goal Progress</span>
                  <Target className="w-4 h-4 text-fuchsia-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mt-1">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-6 bg-[#1A1F30] rounded animate-pulse" />
                  ) : summary && summary.daily_goal.target_minutes > 0 ? (
                    `${summary.daily_goal.completed_minutes} / ${summary.daily_goal.target_minutes}m`
                  ) : (
                    "0 min"
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-slate-400">
                  {isSummaryLoading
                    ? "Checking target..."
                    : summary && summary.daily_goal.completed
                    ? "Daily target completed! 🎉"
                    : summary && summary.daily_goal.target_minutes > 0
                    ? `${summary.daily_goal.target_minutes - summary.daily_goal.completed_minutes}m remaining today`
                    : "No daily target scheduled for today"}
                </p>
                <Link
                  href="/goals"
                  className="text-[11px] text-pink-400 hover:text-pink-300 font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>Set & Log Daily Goal</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </CardContent>
            </Card>

            {/* Backend Connectivity Status Card */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>FastAPI & PostgreSQL</span>
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Connected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-400">
                  User: {user?.email}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Real Pipeline and Courses Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Real Pipeline Breakdown */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Application Pipeline Status
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Live breakdown from PostgreSQL internship records
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-[#252B3D]">
                    {summary?.internships.total ?? 0} Total
                  </Badge>
                  <Link href="/internships">
                    <Button variant="ghost" size="sm" className="text-xs text-pink-400 hover:text-pink-300 py-0.5 px-2">
                      Manage
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isSummaryLoading ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-pink-500 mb-2" />
                    Loading pipeline metrics...
                  </div>
                ) : summary && summary.internships.total > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-center">
                    {[
                      { label: "Saved", count: summary.internships.Saved, color: "text-slate-300" },
                      { label: "Applied", count: summary.internships.Applied, color: "text-pink-400" },
                      { label: "Assessment", count: summary.internships.Assessment, color: "text-purple-400" },
                      { label: "Interview", count: summary.internships.Interview, color: "text-amber-400" },
                      { label: "Selected", count: summary.internships.Selected, color: "text-emerald-400" },
                      { label: "Rejected", count: summary.internships.Rejected, color: "text-rose-400" },
                    ].map((stage) => (
                      <div
                        key={stage.label}
                        className="p-3 rounded-lg bg-[#090A0F] border border-[#1C2132]"
                      >
                        <span className="text-[11px] text-slate-400 block">{stage.label}</span>
                        <p className={`text-lg font-bold mt-1 ${stage.color}`}>{stage.count}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-lg bg-[#090A0F] border border-[#1C2132] text-center space-y-2">
                    <Briefcase className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-white">No Internships Logged Yet</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Your database has no internship applications for this account. In upcoming phases, you will be able to add companies, interviews, and deadlines.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Courses Overview */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white">
                    Enrolled Courses & Milestones
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Live courses data from database
                  </CardDescription>
                </div>
                <Badge variant="pink" className="text-xs">
                  {summary?.courses.enrolled ?? 0} Enrolled
                </Badge>
              </CardHeader>
              <CardContent>
                {isSummaryLoading ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-pink-500 mb-2" />
                    Loading courses data...
                  </div>
                ) : summary && summary.courses.enrolled > 0 ? (
                  <div className="p-4 rounded-lg bg-[#090A0F] border border-[#1C2132] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">Course Progress</span>
                      <span className="text-pink-400 font-mono font-bold">
                        {summary.courses.completed} / {summary.courses.enrolled} Finished
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-lg bg-[#090A0F] border border-[#1C2132] text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-white">No Courses Enrolled</p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Explore course tracks to learn full-stack development, graph algorithms, and system design in the upcoming phases.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Col: AI Suite Quick Launch & Navigation Hub */}
          <div className="space-y-6">
            {/* Quick Navigation Hub */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white">Feature Navigation</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Platform sections and future modules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/courses"
                  className="w-full p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between text-left group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <BookOpen className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                      Courses Catalog
                    </span>
                  </div>
                  <Badge variant="glow" className="text-[10px] text-pink-300 border-pink-500/30">
                    Live
                  </Badge>
                </Link>

                <Link
                  href="/goals"
                  className="w-full p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between text-left group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <Target className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                      Daily Goals & Streaks
                    </span>
                  </div>
                  <Badge variant="glow" className="text-[10px] text-fuchsia-300 border-fuchsia-500/30">
                    Live
                  </Badge>
                </Link>

                <Link
                  href="/internships"
                  className="w-full p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between text-left group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <Briefcase className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                      Internship Applications
                    </span>
                  </div>
                  <Badge variant="glow" className="text-[10px] text-rose-300 border-rose-500/30">
                    Live
                  </Badge>
                </Link>

                <Link
                  href="/notes"
                  className="w-full p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between text-left group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <StickyNote className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                      Engineering Notes
                    </span>
                  </div>
                  <Badge variant="glow" className="text-[10px] text-amber-300 border-amber-500/30">
                    Live
                  </Badge>
                </Link>
              </CardContent>
            </Card>

            {/* AI Career Tools Quick Access */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-white">Local AI Tools</CardTitle>
                  <Badge variant="glow" className="text-[10px]">Ollama Local</Badge>
                </div>
                <CardDescription className="text-xs text-slate-400">
                  Fast, private LLM career assistants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    icon: <FileSearch className="w-4 h-4 text-pink-400" />,
                    title: "Resume ATS Reviewer",
                    desc: "Analyze score & bullets",
                    href: "/ai-tools/resume-review",
                  },
                  {
                    icon: <Send className="w-4 h-4 text-rose-400" />,
                    title: "Cover Letter Generator",
                    desc: "Role-tailored alignment",
                    href: "/ai-tools/cover-letter",
                  },
                  {
                    icon: <HelpCircle className="w-4 h-4 text-fuchsia-400" />,
                    title: "Interview Simulator",
                    desc: "STAR & technical practice",
                    href: "/ai-tools/interview-prep",
                  },
                  {
                    icon: <Compass className="w-4 h-4 text-pink-300" />,
                    title: "Career Roadmap",
                    desc: "Personalized syllabus",
                    href: "/ai-tools/career-roadmap",
                  },
                ].map((tool) => (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className="p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between group block"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-md bg-pink-500/10">
                        {tool.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                          {tool.title}
                        </p>
                        <p className="text-[10px] text-slate-400">{tool.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
