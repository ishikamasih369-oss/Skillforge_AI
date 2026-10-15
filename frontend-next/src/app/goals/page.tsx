"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Target,
  Flame,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Calendar,
  PlusCircle,
  TrendingUp,
  History,
  Hourglass,
  ArrowRight,
  BookOpen,
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
import type { DailyGoal, GoalStreak, GoalHistoryItem } from "@/lib/types/goals";

export default function GoalsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  // State
  const [todayGoal, setTodayGoal] = useState<DailyGoal | null>(null);
  const [streak, setStreak] = useState<GoalStreak>({ current_streak: 0, longest_streak: 0 });
  const [history, setHistory] = useState<GoalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for setting goal
  const [targetMinutesInput, setTargetMinutesInput] = useState<number>(60);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState<boolean>(false);
  const [goalFormError, setGoalFormError] = useState<string | null>(null);

  // Form states for logging progress
  const [completedMinutesInput, setCompletedMinutesInput] = useState<number>(0);
  const [isLoggingProgress, setIsLoggingProgress] = useState<boolean>(false);
  const [progressFormError, setProgressFormError] = useState<string | null>(null);

  // Global feedback notices
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/goals");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load of goals data
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated || !token) return;

    Promise.all([
      apiClient.getTodayGoal(token),
      apiClient.getGoalStreak(token),
      apiClient.getGoalHistory(token),
    ])
      .then(([today, streakData, historyData]) => {
        if (!ignore) {
          setTodayGoal(today);
          if (today) {
            setCompletedMinutesInput(today.completed_minutes);
          }
          setStreak(streakData);
          setHistory(historyData);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Failed to load goals data from backend.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  // User-triggered manual refresh
  const loadGoalsData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const [today, streakData, historyData] = await Promise.all([
        apiClient.getTodayGoal(token),
        apiClient.getGoalStreak(token),
        apiClient.getGoalHistory(token),
      ]);

      setTodayGoal(today);
      if (today) {
        setCompletedMinutesInput(today.completed_minutes);
      }
      setStreak(streakData);
      setHistory(historyData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load goals data from backend.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Create daily goal
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (targetMinutesInput <= 0 || targetMinutesInput > 1440) {
      setGoalFormError("Daily target must be between 1 and 1440 minutes (24 hours).");
      return;
    }

    setGoalFormError(null);
    setIsSubmittingGoal(true);
    setActionSuccess(null);

    try {
      const res = await apiClient.createDailyGoal(targetMinutesInput, token);
      setActionSuccess(`Daily goal of ${res.target_minutes} minutes created successfully!`);
      setTodayGoal({
        goal_id: res.goal_id,
        target_minutes: res.target_minutes,
        completed_minutes: res.completed_minutes,
        completed: res.completed,
      });
      setCompletedMinutesInput(0);
      // Re-fetch streak and history to keep in sync
      const [updatedStreak, updatedHistory] = await Promise.all([
        apiClient.getGoalStreak(token),
        apiClient.getGoalHistory(token),
      ]);
      setStreak(updatedStreak);
      setHistory(updatedHistory);
    } catch (err) {
      if (err instanceof ApiError) {
        setGoalFormError(err.message);
      } else {
        setGoalFormError("Failed to create daily goal.");
      }
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  // Update progress
  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !todayGoal) return;

    if (completedMinutesInput < 0) {
      setProgressFormError("Completed minutes cannot be negative.");
      return;
    }

    if (completedMinutesInput > todayGoal.target_minutes) {
      setProgressFormError(
        `Completed minutes (${completedMinutesInput}m) cannot exceed your target (${todayGoal.target_minutes}m).`
      );
      return;
    }

    setProgressFormError(null);
    setIsLoggingProgress(true);
    setActionSuccess(null);

    try {
      const res = await apiClient.updateGoalProgress(completedMinutesInput, token);
      setActionSuccess(
        res.completed
          ? "🎉 Congratulations! You achieved your daily study target!"
          : `Logged ${res.completed_minutes} of ${res.target_minutes} minutes.`
      );
      setTodayGoal({
        goal_id: res.goal_id,
        target_minutes: res.target_minutes,
        completed_minutes: res.completed_minutes,
        completed: res.completed,
      });

      // Refresh streak and history
      const [updatedStreak, updatedHistory] = await Promise.all([
        apiClient.getGoalStreak(token),
        apiClient.getGoalHistory(token),
      ]);
      setStreak(updatedStreak);
      setHistory(updatedHistory);
    } catch (err) {
      if (err instanceof ApiError) {
        setProgressFormError(err.message);
      } else {
        setProgressFormError("Failed to update progress.");
      }
    } finally {
      setIsLoggingProgress(false);
    }
  };

  const handleQuickAddMinutes = (added: number) => {
    if (!todayGoal) return;
    setCompletedMinutesInput((prev) =>
      Math.min(todayGoal.target_minutes, Math.max(0, prev + added))
    );
    setProgressFormError(null);
  };

  const percentComplete = todayGoal
    ? Math.min(
        100,
        Math.round((todayGoal.completed_minutes / todayGoal.target_minutes) * 100)
      )
    : 0;

  if (authLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 animate-pulse">
          <Target className="w-6 h-6" />
        </div>
        <p className="text-sm text-slate-400">Verifying session...</p>
      </div>
    );
  }

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

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/goals"
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20"
              >
                Daily Goals
              </Link>
              <Link
                href="/courses"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                Course Catalog
              </Link>
              <Link
                href="/courses/my-courses"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                My Courses
              </Link>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                Candidate Cockpit
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Candidate: <span className="text-white font-medium">{user?.name}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadGoalsData}
              disabled={isLoading}
              className="text-xs border-[#252C42]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-pink-400" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Hero Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#111420] via-[#141828] to-[#121624] border border-[#202538] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="glow" className="text-xs">
                Real Goal & Streak Engine
              </Badge>
              <span className="text-xs text-slate-400">
                Connected to FastAPI PostgreSQL Backend
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Daily Learning <span className="text-pink-400">Goals & Habit Streaks</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Consistency separates candidates. Set a daily study target in minutes, log your focused sessions, and build uninterrupted streaks.
            </p>
          </div>

          {/* Streak Metric Highlights */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-4 rounded-xl bg-[#090A0F] border border-amber-500/20 text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold mb-0.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Current Streak</span>
              </div>
              <p className="text-2xl font-black text-white">
                {streak.current_streak}{" "}
                <span className="text-xs font-normal text-slate-400">
                  {streak.current_streak === 1 ? "Day" : "Days"}
                </span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090A0F] border border-purple-500/20 text-center min-w-[120px]">
              <div className="flex items-center justify-center gap-1.5 text-xs text-purple-400 font-semibold mb-0.5">
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>Best Streak</span>
              </div>
              <p className="text-2xl font-black text-white">
                {streak.longest_streak}{" "}
                <span className="text-xs font-normal text-slate-400">
                  {streak.longest_streak === 1 ? "Day" : "Days"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Global Feedback Notice */}
        {actionSuccess && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={loadGoalsData}
              className="text-xs"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Today's Goal Section & Progress Logger Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Today's Goal Status & Controls */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#11141E] border-[#202536] shadow-xl">
              <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-pink-400" />
                    <span>Today&apos;s Learning Target</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Live target tracked via POST & PUT /api/goals
                  </CardDescription>
                </div>
                {todayGoal ? (
                  todayGoal.completed ? (
                    <Badge variant="glow" className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                      Goal Completed 🎉
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-amber-300 border-amber-500/30">
                      In Progress
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-xs border-[#252C42] text-slate-400">
                    No Target Yet
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-pink-500" />
                    <p>Loading today&apos;s goal status...</p>
                  </div>
                ) : todayGoal ? (
                  /* Existing Goal for Today: Progress Logger */
                  <div className="space-y-6">
                    {/* Progress Bar & Breakdown */}
                    <div className="p-5 rounded-xl bg-[#090A0F] border border-[#1C2132] space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-2">
                          <Hourglass className="w-4 h-4 text-pink-400" />
                          <span>Study Progress</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-pink-400">
                          {todayGoal.completed_minutes} / {todayGoal.target_minutes} minutes ({percentComplete}%)
                        </span>
                      </div>

                      <div className="w-full bg-[#1A1F2E] rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>
                          {todayGoal.completed
                            ? "Target achieved! Keep going or rest up."
                            : `${todayGoal.target_minutes - todayGoal.completed_minutes} minutes remaining today.`}
                        </span>
                        <span className="font-mono text-slate-300">
                          Target: {todayGoal.target_minutes}m
                        </span>
                      </div>
                    </div>

                    {/* Progress Update Form */}
                    <form onSubmit={handleUpdateProgress} className="space-y-4">
                      {progressFormError && (
                        <div
                          role="alert"
                          className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{progressFormError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 block">
                          Update Completed Minutes:
                        </label>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max={todayGoal.target_minutes}
                            value={completedMinutesInput}
                            onChange={(e) => {
                              setCompletedMinutesInput(Number(e.target.value));
                              setProgressFormError(null);
                            }}
                            className="w-32 px-3 py-2 bg-[#090A0F] border border-[#22283C] rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                          />
                          <span className="text-xs text-slate-400">
                            minutes completed so far today
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] text-slate-500">Quick add:</span>
                          <button
                            type="button"
                            onClick={() => handleQuickAddMinutes(15)}
                            className="px-2.5 py-1 text-xs rounded bg-[#161B2B] hover:bg-[#1D2338] text-slate-300 border border-[#23293D] transition-colors"
                          >
                            +15 min
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAddMinutes(30)}
                            className="px-2.5 py-1 text-xs rounded bg-[#161B2B] hover:bg-[#1D2338] text-slate-300 border border-[#23293D] transition-colors"
                          >
                            +30 min
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCompletedMinutesInput(todayGoal.target_minutes)
                            }
                            className="px-2.5 py-1 text-xs rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                          >
                            Complete Target ({todayGoal.target_minutes}m)
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isLoggingProgress}
                        disabled={
                          isLoggingProgress ||
                          completedMinutesInput === todayGoal.completed_minutes
                        }
                        className="w-full sm:w-auto font-semibold text-xs"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        <span>Save Today&apos;s Progress</span>
                      </Button>
                    </form>
                  </div>
                ) : (
                  /* No Goal For Today: Create Form */
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1C2132] space-y-2">
                      <h4 className="text-sm font-semibold text-white">
                        No Goal Established For Today
                      </h4>
                      <p className="text-xs text-slate-400">
                        Commit to a specific study target (in minutes) to keep your learning velocity high and maintain your streak.
                      </p>
                    </div>

                    <form onSubmit={handleCreateGoal} className="space-y-4">
                      {goalFormError && (
                        <div
                          role="alert"
                          className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                          <span>{goalFormError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 block">
                          Target Study Minutes for Today:
                        </label>

                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            value={targetMinutesInput}
                            onChange={(e) => {
                              setTargetMinutesInput(Number(e.target.value));
                              setGoalFormError(null);
                            }}
                            className="w-32 px-3 py-2 bg-[#090A0F] border border-[#22283C] rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                          />
                          <span className="text-xs text-slate-400">
                            minutes (1 - 1440 max)
                          </span>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className="text-[11px] text-slate-500">Presets:</span>
                          {[30, 45, 60, 90, 120].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => {
                                setTargetMinutesInput(mins);
                                setGoalFormError(null);
                              }}
                              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                                targetMinutesInput === mins
                                  ? "bg-pink-500 text-white border-pink-500"
                                  : "bg-[#161B2B] text-slate-300 border-[#23293D] hover:bg-[#1D2338]"
                              }`}
                            >
                              {mins} min
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        isLoading={isSubmittingGoal}
                        disabled={isSubmittingGoal}
                        className="w-full sm:w-auto font-semibold text-xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                        <span>Commit Daily Goal</span>
                      </Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goal History Section */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-pink-400" />
                    <span>Learning History & Past Goals</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Live log from GET /api/goals/history
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs border-[#252C42]">
                  {history.length} Recorded
                </Badge>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto text-pink-500 mb-1" />
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div className="p-6 rounded-lg bg-[#090A0F] border border-[#1C2132] text-center space-y-2">
                    <Calendar className="w-6 h-6 text-slate-500 mx-auto" />
                    <p className="text-xs font-semibold text-white">No Goal History Yet</p>
                    <p className="text-[11px] text-slate-400">
                      As you create daily goals and complete study sessions, your timeline and streak records will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {history.map((item) => (
                      <div
                        key={item.goal_id}
                        className="p-3 rounded-lg bg-[#090A0F] border border-[#1C2132] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center ${
                              item.completed
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Hourglass className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-white block">
                              {item.date}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Goal #{item.goal_id}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-slate-300">
                            {item.completed_minutes} / {item.target_minutes}m
                          </span>
                          {item.completed ? (
                            <Badge
                              variant="glow"
                              className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            >
                              Achieved
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-amber-300 border-amber-500/30"
                            >
                              Partial
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right 1 Col: Quick Links & Streak Tips */}
          <div className="space-y-6">
            {/* Streak Mechanics Card */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>How Streaks Work</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Backend calculation rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1C2132] space-y-1">
                  <span className="font-semibold text-white block">1. 100% Target Completion</span>
                  <p className="text-[11px] text-slate-400">
                    A day counts toward your streak only when completed minutes match or exceed your committed target.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1C2132] space-y-1">
                  <span className="font-semibold text-white block">2. Consecutive Calendar Days</span>
                  <p className="text-[11px] text-slate-400">
                    Streaks increment for each uninterrupted day. If a day is missed without a completed goal, the current streak resets to 0.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#090A0F] border border-[#1C2132] space-y-1">
                  <span className="font-semibold text-white block">3. Best Streak Preservation</span>
                  <p className="text-[11px] text-slate-400">
                    Your all-time longest streak is permanently preserved on your candidate profile.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Action Navigation */}
            <Card className="bg-[#11141E] border-[#202536]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-white">Study Hub</CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Jump into technical coursework
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/courses"
                  className="p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <BookOpen className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                        Explore Courses
                      </p>
                      <p className="text-[10px] text-slate-400">Browse technical syllabi</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/courses/my-courses"
                  className="p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                        My Active Courses
                      </p>
                      <p className="text-[10px] text-slate-400">Log progress milestones</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  href="/dashboard"
                  className="p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] hover:border-pink-500/40 transition-colors flex items-center justify-between group block"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-pink-500/10">
                      <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">
                        Candidate Cockpit
                      </p>
                      <p className="text-[10px] text-slate-400">Full dashboard overview</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
