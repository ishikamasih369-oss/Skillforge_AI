"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Sparkles,
  Clock,
  User,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  GraduationCap,
  Sliders,
  Layers,
  Award,
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
import type { Course, MyCourse } from "@/lib/types/courses";

function CourseDetailContent() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;
  const courseId = Number(rawId);

  const { token, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledRecord, setEnrolledRecord] = useState<MyCourse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Enrollment & Progress mutation states
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Initial load of course details
  useEffect(() => {
    let ignore = false;
    if (isNaN(courseId) || courseId <= 0) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setError("Invalid course ID specified.");
          setIsLoading(false);
        }
      });
      return;
    }

    apiClient
      .getCourse(courseId)
      .then(async (courseData) => {
        if (ignore) return;
        setCourse(courseData);
        setError(null);

        if (token) {
          try {
            const userCourses = await apiClient.getMyCourses(token);
            if (!ignore) {
              const match = userCourses.find((c) => c.course_id === courseId);
              if (match) {
                setEnrolledRecord(match);
                setProgressValue(match.progress);
              } else {
                setEnrolledRecord(null);
              }
            }
          } catch {
            // Non-fatal
          }
        }

        if (!ignore) {
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            if (err.status === 404) {
              setError("Course not found. It may have been removed or unpublished.");
            } else {
              setError(err.message);
            }
          } else {
            setError("Failed to load course information from backend.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [courseId, token]);

  // User-triggered manual reload
  const loadCourseDetail = useCallback(async () => {
    if (isNaN(courseId) || courseId <= 0) {
      setError("Invalid course ID specified.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const courseData = await apiClient.getCourse(courseId);
      setCourse(courseData);

      if (token) {
        try {
          const userCourses = await apiClient.getMyCourses(token);
          const match = userCourses.find((c) => c.course_id === courseId);
          if (match) {
            setEnrolledRecord(match);
            setProgressValue(match.progress);
          } else {
            setEnrolledRecord(null);
          }
        } catch {
          // Ignore secondary failure
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("Course not found. It may have been removed or unpublished.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load course information from backend.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, token]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    setIsEnrolling(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await apiClient.enrollCourse(courseId, token ?? undefined);
      setActionSuccess("Successfully enrolled! You can now track your learning progress.");
      setEnrolledRecord({
        course_id: courseId,
        title: course?.title || "",
        description: course?.description || "",
        category: course?.category || "",
        difficulty: course?.difficulty || "",
        instructor: course?.instructor || "",
        duration_hours: course?.duration_hours || 0,
        image_url: course?.image_url || null,
        progress: res.progress,
        completed: res.completed,
      });
      setProgressValue(res.progress);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to enroll in this course. Please try again.");
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // Handle progress update
  const handleSaveProgress = async () => {
    if (!token) return;
    setIsUpdatingProgress(true);
    setActionSuccess(null);
    setActionError(null);

    const cleanProgress = Math.min(100, Math.max(0, Math.round(progressValue)));

    try {
      const res = await apiClient.updateCourseProgress(courseId, cleanProgress, token);
      setActionSuccess(`Progress updated to ${res.progress}%!`);
      if (enrolledRecord) {
        setEnrolledRecord({
          ...enrolledRecord,
          progress: res.progress,
          completed: res.completed,
        });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to update progress.");
      }
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const isEnrolled = Boolean(enrolledRecord);
  const isDirty = enrolledRecord && progressValue !== enrolledRecord.progress;

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
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-pink-500/10 text-pink-300 border border-pink-500/20"
              >
                Course Catalog
              </Link>
              <Link
                href="/courses/my-courses"
                className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-400 hover:text-white hover:bg-[#141824] transition-colors"
              >
                My Enrolled Courses
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

          <Link href="/courses">
            <Button variant="outline" size="sm" className="text-xs border-[#252C42]">
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back to Catalog</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/courses" className="hover:text-pink-400 transition-colors">
            Courses
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-medium truncate max-w-md">
            {course?.title || `Course #${courseId}`}
          </span>
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

        {isLoading ? (
          /* Loading Skeleton */
          <div className="space-y-6">
            <div className="p-8 rounded-2xl bg-[#11141E] border border-[#202536] animate-pulse space-y-4">
              <div className="w-24 h-5 bg-[#1A1F30] rounded" />
              <div className="w-1/2 h-8 bg-[#1A1F30] rounded" />
              <div className="w-3/4 h-4 bg-[#1A1F30] rounded" />
            </div>
          </div>
        ) : error || !course ? (
          /* Error State */
          <div className="p-12 rounded-2xl bg-[#11141E] border border-rose-500/30 text-center max-w-lg mx-auto space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Course Not Available</h3>
            <p className="text-xs text-slate-400">{error || "Course could not be loaded."}</p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/courses">
                <Button variant="secondary" size="sm" className="text-xs">
                  Browse Catalog
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={loadCourseDetail}
                className="text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        ) : (
          /* Course Detail Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Details & Curriculum Outline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Box */}
              <div className="p-6 sm:p-8 rounded-2xl bg-[#11141E] border border-[#202536] space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="glow" className="text-xs">
                    {course.category}
                  </Badge>
                  <Badge
                    variant="slate"
                    className="text-xs bg-[#161B2B] text-slate-300 capitalize"
                  >
                    Difficulty: {course.difficulty}
                  </Badge>
                  {isEnrolled && (
                    <Badge
                      variant="outline"
                      className="text-xs border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1 inline" />
                      {enrolledRecord?.completed ? "Completed" : "Enrolled"}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {course.title}
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {course.description}
                </p>

                <div className="pt-4 border-t border-[#1C2132] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-slate-400">
                  <div>
                    <span className="block text-slate-500 text-[11px]">Instructor</span>
                    <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      {course.instructor}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[11px]">Duration</span>
                    <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-pink-400" />
                      {course.duration_hours} hours
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[11px]">Catalog ID</span>
                    <span className="text-white font-medium font-mono mt-0.5 block">
                      #{course.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Course Syllabus Overview */}
              <Card className="bg-[#11141E] border-[#202536]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-400" />
                    <span>Technical Syllabus & Core Competencies</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Milestones and topics covered in this {course.duration_hours}-hour curriculum
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      module: "01",
                      title: "Foundational Architecture & Setup",
                      desc: "Environment setup, core paradigms, and syntax fundamentals.",
                    },
                    {
                      module: "02",
                      title: "Applied Engineering & Patterns",
                      desc: "Real-world implementations, state management, and idiomatic patterns.",
                    },
                    {
                      module: "03",
                      title: "Production Optimization & Testing",
                      desc: "Profiling performance, benchmark tests, and robust error handling.",
                    },
                  ].map((mod) => (
                    <div
                      key={mod.module}
                      className="p-3.5 rounded-lg bg-[#090A0F] border border-[#1C2132] flex items-start gap-3.5"
                    >
                      <span className="w-7 h-7 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {mod.module}
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-white">{mod.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{mod.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Enrollment & Progress Control Card */}
            <div className="space-y-6">
              <Card className="bg-[#11141E] border-[#202536] shadow-xl sticky top-24">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-white">
                      Enrollment & Status
                    </CardTitle>
                    <Badge variant="glow" className="text-[10px]">
                      PostgreSQL Sync
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-400">
                    Track your learning velocity directly
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {isEnrolled ? (
                    /* Enrolled State: Progress Controls */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1C2132] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-pink-400" />
                            <span>Current Progress</span>
                          </span>
                          <span className="font-mono text-sm font-bold text-pink-400">
                            {enrolledRecord?.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1A1F2E] rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-2.5 rounded-full transition-all"
                            style={{ width: `${enrolledRecord?.progress}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 pt-1">
                          {enrolledRecord?.completed
                            ? "Course marked complete! Great achievement."
                            : `${100 - (enrolledRecord?.progress ?? 0)}% remaining to completion.`}
                        </p>
                      </div>

                      {/* Interactive Progress Slider */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-pink-400" />
                            <span>Adjust Milestone (%)</span>
                          </span>
                          <span className="font-mono text-xs text-pink-300">
                            {progressValue}%
                          </span>
                        </label>

                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={progressValue}
                          onChange={(e) => setProgressValue(Number(e.target.value))}
                          className="w-full accent-pink-500 cursor-pointer"
                        />

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              setProgressValue((v) => Math.min(100, v + 25))
                            }
                            className="flex-1 py-1 text-xs rounded bg-[#161B2B] hover:bg-[#1D2338] text-slate-300 border border-[#23293D] transition-colors"
                          >
                            +25%
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgressValue(100)}
                            className="flex-1 py-1 text-xs rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
                          >
                            100%
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full text-xs font-semibold"
                        onClick={handleSaveProgress}
                        isLoading={isUpdatingProgress}
                        disabled={!isDirty || isUpdatingProgress}
                      >
                        <span>Save Milestone Progress</span>
                      </Button>

                      <Link href="/courses/my-courses" className="block pt-1">
                        <Button
                          variant="secondary"
                          className="w-full text-xs"
                        >
                          <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
                          <span>View All Enrolled Courses</span>
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    /* Not Enrolled State */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[#090A0F] border border-[#1C2132] space-y-2 text-xs">
                        <span className="text-slate-400 block">Enrollment Status:</span>
                        <p className="text-sm font-semibold text-white">
                          Not enrolled in this course
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Enrolling allows you to log chapter progress, record time toward daily streaks, and link achievements to your dashboard.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        className="w-full text-xs font-semibold"
                        onClick={handleEnroll}
                        isLoading={isEnrolling}
                        disabled={isEnrolling}
                      >
                        <GraduationCap className="w-4 h-4 mr-2" />
                        <span>Enroll in This Course</span>
                      </Button>

                      {!isAuthenticated && (
                        <p className="text-[11px] text-slate-400 text-center">
                          You will be asked to sign in before enrolling.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#090A0F] flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 animate-pulse" />
        </div>
      }
    >
      <CourseDetailContent />
    </React.Suspense>
  );
}

