"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Sliders,
  ChevronRight,
  TrendingUp,
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
import type { MyCourse } from "@/lib/types/courses";

export default function MyCoursesPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track progress edit state per course: { [courseId]: number }
  const [editingProgress, setEditingProgress] = useState<Record<number, number>>({});
  const [updatingCourseId, setUpdatingCourseId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/courses/my-courses");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load of enrolled courses
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated || !token) return;

    apiClient
      .getMyCourses(token)
      .then((data) => {
        if (!ignore) {
          setMyCourses(data);
          const initialMap: Record<number, number> = {};
          data.forEach((c) => {
            initialMap[c.course_id] = c.progress;
          });
          setEditingProgress(initialMap);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Failed to load your enrolled courses.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  // Manual reload of enrolled courses
  const loadMyCourses = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getMyCourses(token);
      setMyCourses(data);
      const initialMap: Record<number, number> = {};
      data.forEach((c) => {
        initialMap[c.course_id] = c.progress;
      });
      setEditingProgress(initialMap);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load your enrolled courses.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Save updated progress via PUT /api/courses/{course_id}/progress
  const handleSaveProgress = async (courseId: number, courseTitle: string) => {
    if (!token) return;
    const progressVal = editingProgress[courseId] ?? 0;
    const cleanProgress = Math.min(100, Math.max(0, Math.round(progressVal)));

    setUpdatingCourseId(courseId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await apiClient.updateCourseProgress(courseId, cleanProgress, token);
      setActionSuccess(`Updated "${courseTitle}" progress to ${res.progress}%!`);
      // Update local state
      setMyCourses((prev) =>
        prev.map((c) =>
          c.course_id === courseId
            ? { ...c, progress: res.progress, completed: res.completed }
            : c
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update progress. Please try again.");
      }
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleQuickAdd = (courseId: number, delta: number) => {
    setEditingProgress((prev) => {
      const current = prev[courseId] ?? 0;
      return {
        ...prev,
        [courseId]: Math.min(100, Math.max(0, current + delta)),
      };
    });
  };

  const completedCount = myCourses.filter((c) => c.completed).length;

  if (authLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 animate-pulse">
          <GraduationCap className="w-6 h-6" />
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
                href="/courses"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                Course Catalog
              </Link>
              <Link
                href="/courses/my-courses"
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20"
              >
                My Enrolled Courses ({myCourses.length})
              </Link>
              <Link
                href="/goals"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                Daily Goals
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
            <Link href="/courses">
              <Button variant="primary" size="sm" className="text-xs">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                <span>Browse Catalog</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Summary Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#111420] via-[#141828] to-[#121624] border border-[#202538] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="glow" className="text-xs">
                Active Learning Tracker
              </Badge>
              <span className="text-xs text-slate-400">
                Live Data from GET /api/courses/my-courses
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Enrolled <span className="text-pink-400">Courses & Milestones</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Log module completions and adjust skill progress. All milestones synchronize with your candidate cockpit.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#1C2132] text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block">Enrolled</span>
              <p className="text-xl font-bold text-white mt-0.5">{myCourses.length}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#090A0F] border border-[#1C2132] text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block">Completed</span>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">{completedCount}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMyCourses}
              disabled={isLoading}
              className="text-xs border-[#2B334B] self-stretch"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-pink-400" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Action Banners */}
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

        {actionError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          /* Skeletons */
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="bg-[#11141E] border-[#202536] animate-pulse p-6">
                <div className="w-1/3 h-5 bg-[#1A1F30] rounded mb-3" />
                <div className="w-full h-3 bg-[#1A1F30] rounded mb-4" />
                <div className="w-1/4 h-8 bg-[#1A1F30] rounded" />
              </Card>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 rounded-2xl bg-[#11141E] border border-rose-500/30 text-center max-w-lg mx-auto space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Error Loading Enrolled Courses</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <Button variant="primary" size="sm" onClick={loadMyCourses} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Retry
            </Button>
          </div>
        ) : myCourses.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#11141E] border border-[#202536] text-center max-w-lg mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">No Enrolled Courses Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              You haven&apos;t enrolled in any courses in the database yet. Browse the course catalog to enroll in programming, backend architecture, and technical interview tracks.
            </p>
            <div className="pt-2">
              <Link href="/courses">
                <Button variant="primary" size="sm" className="text-xs font-semibold">
                  <span>Explore Course Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Enrolled Courses List */
          <div className="space-y-6">
            {myCourses.map((course) => {
              const currentProgress = editingProgress[course.course_id] ?? course.progress;
              const isDirty = currentProgress !== course.progress;
              const isUpdatingThis = updatingCourseId === course.course_id;

              return (
                <Card
                  key={course.course_id}
                  className="bg-[#11141E] border-[#202536] hover:border-pink-500/30 transition-all shadow-lg"
                >
                  <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] border-[#252C42] text-pink-300">
                          {course.category}
                        </Badge>
                        <Badge
                          variant="slate"
                          className="text-[10px] bg-[#161B2B] text-slate-300 capitalize"
                        >
                          {course.difficulty}
                        </Badge>
                        {course.completed ? (
                          <Badge variant="glow" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                            Completed 🎉
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/30">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold text-white">
                        {course.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-400">
                        Instructor: <span className="text-slate-300">{course.instructor}</span> &bull; {course.duration_hours} hours total
                      </CardDescription>
                    </div>

                    <Link href={`/courses/${course.course_id}`}>
                      <Button variant="secondary" size="sm" className="text-xs">
                        <span>Course Info</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Progress Bar Display */}
                    <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1C2132] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-pink-400" />
                          <span>Milestone Completion</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-pink-400">
                          {currentProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-[#1A1F2E] rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-pink-500 via-rose-500 to-fuchsia-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${currentProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Adjuster Controls */}
                    <div className="p-4 rounded-xl bg-[#0E111B] border border-[#1C2132] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-pink-400" />
                          <span>Update Your Progress (0% to 100%)</span>
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={currentProgress}
                            onChange={(e) =>
                              setEditingProgress((prev) => ({
                                ...prev,
                                [course.course_id]: Number(e.target.value),
                              }))
                            }
                            className="flex-1 accent-pink-500 cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-white w-10 text-right">
                            {currentProgress}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(course.course_id, 10)}
                          className="px-2.5 py-1 text-xs rounded-md bg-[#161B2B] hover:bg-[#1D2338] text-slate-300 border border-[#23293D] transition-colors"
                        >
                          +10%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(course.course_id, 25)}
                          className="px-2.5 py-1 text-xs rounded-md bg-[#161B2B] hover:bg-[#1D2338] text-slate-300 border border-[#23293D] transition-colors"
                        >
                          +25%
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingProgress((prev) => ({
                              ...prev,
                              [course.course_id]: 100,
                            }))
                          }
                          className="px-2.5 py-1 text-xs rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                        >
                          100% (Complete)
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            handleSaveProgress(course.course_id, course.title)
                          }
                          isLoading={isUpdatingThis}
                          disabled={!isDirty || isUpdatingThis}
                          className="text-xs font-semibold ml-1"
                        >
                          <span>Save Progress</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
