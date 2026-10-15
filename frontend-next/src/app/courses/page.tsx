"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Sparkles,
  Clock,
  User,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Filter,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Course, MyCourse } from "@/lib/types/courses";

export default function CourseCatalogPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  // Track enrolling course id for button loading state
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Initial load of catalog data
  useEffect(() => {
    let ignore = false;

    apiClient
      .getCourses()
      .then(async (catalogData) => {
        if (ignore) return;
        setCourses(catalogData);
        setError(null);

        if (token) {
          try {
            const userCourses = await apiClient.getMyCourses(token);
            if (!ignore) {
              setMyCourses(userCourses);
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
            setError(err.message);
          } else {
            setError("Failed to load courses from the backend server.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  // User-triggered manual reload
  const loadCatalogData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const catalogData = await apiClient.getCourses();
      setCourses(catalogData);

      if (token) {
        try {
          const userCourses = await apiClient.getMyCourses(token);
          setMyCourses(userCourses);
        } catch {
          // If my-courses fails, catalog still displays
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load courses from the backend server.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Map of enrolled courses by course_id for fast lookup
  const enrollmentMap = useMemo(() => {
    const map = new Map<number, MyCourse>();
    for (const mc of myCourses) {
      map.set(mc.course_id, mc);
    }
    return map;
  }, [myCourses]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["All", ...Array.from(set)];
  }, [courses]);

  // Extract unique difficulties
  const difficulties = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.difficulty) set.add(c.difficulty);
    });
    return ["All", ...Array.from(set)];
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        course.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesDifficulty =
        selectedDifficulty === "All" ||
        course.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty]);

  // Enroll handler
  const handleEnroll = async (courseId: number, courseTitle: string) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/courses`);
      return;
    }

    setEnrollingCourseId(courseId);
    setActionSuccess(null);
    setActionError(null);

    try {
      const res = await apiClient.enrollCourse(courseId, token ?? undefined);
      setActionSuccess(`Enrolled in "${courseTitle}" successfully!`);
      // Update local enrolled list
      setMyCourses((prev) => [
        ...prev,
        {
          course_id: courseId,
          title: courseTitle,
          description: "",
          category: "",
          difficulty: "",
          instructor: "",
          duration_hours: 0,
          image_url: null,
          progress: res.progress,
          completed: res.completed,
        },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to enroll in course. Please try again.");
      }
    } finally {
      setEnrollingCourseId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
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
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {user?.name}
                </span>
                <Link href="/courses/my-courses">
                  <Button variant="outline" size="sm" className="text-xs border-[#252C42]">
                    <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-pink-400" />
                    <span>My Enrolled ({myCourses.length})</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="text-xs">
                  Sign In to Enroll
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#111420] via-[#141828] to-[#121624] border border-[#202538] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="glow" className="text-xs">
                Real Catalog API
              </Badge>
              <span className="text-xs text-slate-400">
                Connected to FastAPI PostgreSQL Backend
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Engineering <span className="text-pink-400">Course Catalog</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Enroll in technical courses, track milestone completions, and sharpen competencies for software engineering roles.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link href="/courses/my-courses">
              <Button variant="secondary" size="sm" className="text-xs">
                <GraduationCap className="w-4 h-4 mr-1.5 text-pink-400" />
                <span>My Active Progress ({myCourses.length})</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCatalogData}
              disabled={isLoading}
              className="text-xs border-[#2B334B]"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-pink-400" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {actionSuccess && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 text-xs text-emerald-300"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <Link href="/courses/my-courses">
              <Button variant="outline" size="sm" className="text-xs border-emerald-500/40 text-emerald-300">
                Go to My Courses &rarr;
              </Button>
            </Link>
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs text-rose-300"
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

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-xl bg-[#11141E] border border-[#202536] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, instructor, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#090A0F] border border-[#22283C] rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
            />
          </div>

          {/* Category & Difficulty Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Category:</span>
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {categories.slice(0, 5).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-pink-500 text-white"
                      : "bg-[#090A0F] border border-[#202536] text-slate-400 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {difficulties.length > 2 && (
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="bg-[#090A0F] border border-[#202536] rounded-md px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-pink-500"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    Difficulty: {diff}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-[#11141E] border-[#202536] animate-pulse">
                <CardHeader className="space-y-2">
                  <div className="w-20 h-4 bg-[#1A1F30] rounded" />
                  <div className="w-3/4 h-6 bg-[#1A1F30] rounded" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="w-full h-12 bg-[#1A1F30] rounded" />
                  <div className="w-1/2 h-4 bg-[#1A1F30] rounded" />
                </CardContent>
                <CardFooter>
                  <div className="w-full h-9 bg-[#1A1F30] rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-8 rounded-2xl bg-[#11141E] border border-rose-500/30 text-center max-w-lg mx-auto space-y-4">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Unable to Load Courses</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <Button variant="primary" size="sm" onClick={loadCatalogData} className="text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#11141E] border border-[#202536] text-center max-w-lg mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Courses Found</h3>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedCategory !== "All"
                ? "No courses match your filter criteria. Try clearing search or resetting filters."
                : "No courses are published in the database yet."}
            </p>
            {(searchQuery || selectedCategory !== "All") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedDifficulty("All");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          /* Course Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const enrolledRecord = enrollmentMap.get(course.id);
              const isEnrolled = Boolean(enrolledRecord);
              const isEnrollingThis = enrollingCourseId === course.id;

              return (
                <Card
                  key={course.id}
                  className="bg-[#11141E] border-[#202536] flex flex-col justify-between hover:border-pink-500/30 transition-all shadow-md group"
                >
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] border-[#252C42] text-pink-300">
                        {course.category}
                      </Badge>
                      <Badge
                        variant="slate"
                        className="text-[10px] bg-[#161B2B] text-slate-300 capitalize"
                      >
                        {course.difficulty}
                      </Badge>
                    </div>

                    <CardTitle className="text-lg font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-1">
                      {course.title}
                    </CardTitle>

                    <CardDescription className="text-xs text-slate-400 line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1C2132]">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-pink-400" />
                        {course.instructor}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {course.duration_hours} hrs
                      </span>
                    </div>

                    {/* Progress indicator if enrolled */}
                    {isEnrolled && (
                      <div className="p-2.5 rounded-lg bg-[#090A0F] border border-[#1C2132] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {enrolledRecord?.completed ? "Completed" : "In Progress"}
                          </span>
                          <span className="font-mono text-pink-400 font-bold">
                            {enrolledRecord?.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-[#1A1F2E] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full"
                            style={{ width: `${enrolledRecord?.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-[#1C2132] flex items-center gap-2">
                    <Link href={`/courses/${course.id}`} className="flex-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full text-xs font-medium"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>

                    {isEnrolled ? (
                      <Link href="/courses/my-courses" className="flex-1">
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs font-semibold"
                        >
                          <span>Continue</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEnroll(course.id, course.title)}
                        isLoading={isEnrollingThis}
                        disabled={isEnrollingThis}
                        className="flex-1 text-xs font-semibold"
                      >
                        <span>Enroll Now</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
