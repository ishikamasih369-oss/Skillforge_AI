"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  FileText,
  ChevronRight,
  X,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type {
  Internship,
  InternshipCreate,
  InternshipStatus,
  InternshipStats,
} from "@/lib/types/internships";

const STATUS_OPTIONS: InternshipStatus[] = [
  "Saved",
  "Applied",
  "Assessment",
  "Interview",
  "Selected",
  "Rejected",
];

export default function InternshipsPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Primary data state
  const [internships, setInternships] = useState<Internship[]>([]);
  const [stats, setStats] = useState<InternshipStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "company" | "deadline">("newest");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete modal state
  const [internshipToDelete, setInternshipToDelete] = useState<Internship | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<{
    company: string;
    role: string;
    location: string;
    status: InternshipStatus;
    application_date: string;
    deadline: string;
    job_url: string;
    notes: string;
  }>({
    company: "",
    role: "",
    location: "",
    status: "Saved",
    application_date: "",
    deadline: "",
    job_url: "",
    notes: "",
  });

  // Protected route guard: Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/internships");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load of internships and stats
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated || !token) return;

    Promise.all([
      apiClient.getInternships(token),
      apiClient.getInternshipStats(token),
    ])
      .then(([internshipsData, statsData]) => {
        if (!ignore) {
          setInternships(internshipsData);
          setStats(statsData);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Failed to load internship applications. Please try again.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  // Explicit user-triggered refresh
  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const [internshipsData, statsData] = await Promise.all([
        apiClient.getInternships(token),
        apiClient.getInternshipStats(token),
      ]);
      setInternships(internshipsData);
      setStats(statsData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load internship applications. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Handle Status Update
  const handleStatusChange = async (internshipId: number, newStatus: InternshipStatus) => {
    if (!token) return;
    try {
      await apiClient.updateInternshipStatus(internshipId, newStatus, token);
      // Optimistically update local list
      setInternships((prev) =>
        prev.map((item) =>
          item.id === internshipId ? { ...item, status: newStatus } : item
        )
      );
      // Re-fetch stats in background
      apiClient.getInternshipStats(token).then(setStats).catch(() => {});
      setActionSuccess(`Application status moved to ${newStatus}`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update status";
      setError(msg);
    }
  };

  // Handle Form Submission for Adding Application
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Client-side validations
    if (formData.company.trim().length < 2) {
      setModalError("Company name must be at least 2 characters long.");
      return;
    }
    if (formData.role.trim().length < 2) {
      setModalError("Role title must be at least 2 characters long.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload: InternshipCreate = {
      company: formData.company.trim(),
      role: formData.role.trim(),
      location: formData.location.trim() ? formData.location.trim() : null,
      status: formData.status,
      application_date: formData.application_date
        ? new Date(formData.application_date).toISOString()
        : null,
      deadline: formData.deadline
        ? new Date(formData.deadline).toISOString()
        : null,
      job_url: formData.job_url.trim() ? formData.job_url.trim() : null,
      notes: formData.notes.trim() ? formData.notes.trim() : null,
    };

    try {
      const newInternship = await apiClient.createInternship(payload, token);
      setInternships((prev) => [newInternship, ...prev]);
      // Update stats
      apiClient.getInternshipStats(token).then(setStats).catch(() => {});

      setIsAddModalOpen(false);
      setFormData({
        company: "",
        role: "",
        location: "",
        status: "Saved",
        application_date: "",
        deadline: "",
        job_url: "",
        notes: "",
      });
      setActionSuccess(`Application for ${newInternship.company} added!`);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError("Failed to save application. Please verify all inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!token || !internshipToDelete) return;
    setIsDeleting(true);

    try {
      await apiClient.deleteInternship(internshipToDelete.id, token);
      setInternships((prev) => prev.filter((item) => item.id !== internshipToDelete.id));
      // Update stats
      apiClient.getInternshipStats(token).then(setStats).catch(() => {});

      setActionSuccess(`Application for ${internshipToDelete.company} removed.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setInternshipToDelete(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete application";
      setError(msg);
      setInternshipToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered and Sorted Internships
  const filteredInternships = useMemo(() => {
    return internships
      .filter((item) => {
        const matchesQuery =
          searchQuery.trim() === "" ||
          item.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          selectedStatus === "ALL" || item.status === selectedStatus;

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "company") {
          return a.company.localeCompare(b.company);
        }
        if (sortBy === "deadline") {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        // "newest" by ID (or created order)
        return b.id - a.id;
      });
  }, [internships, searchQuery, selectedStatus, sortBy]);

  // Helper for Status Badge Styling
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "Saved":
        return <Badge variant="slate">Saved</Badge>;
      case "Applied":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/15 text-sky-400 border border-sky-500/30">
            Applied
          </span>
        );
      case "Assessment":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Assessment
          </span>
        );
      case "Interview":
        return <Badge variant="glow">Interviewing</Badge>;
      case "Selected":
        return <Badge variant="success">Offer / Selected</Badge>;
      case "Rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
            Rejected
          </span>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper for Date Formatting
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (authLoading || (!isAuthenticated && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-[#090A0F] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-xl shadow-pink-500/25 animate-pulse">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-pink-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/dashboard" className="hover:text-pink-400 transition-colors">
            Candidate Cockpit
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-medium">Internship Applications</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="pink" size="sm">
                Recruitment Pipeline
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                {internships.length} applications logged
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-pink-400" />
              <span>Internship Application Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Organize your recruiting lifecycle, monitor upcoming deadlines, and track status transitions across top tech companies.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="text-xs border-[#252C42]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-pink-400" : ""}`} />
              <span>Sync</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalError(null);
                setIsAddModalOpen(true);
              }}
              className="text-xs font-semibold shadow-lg shadow-pink-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Track New Application</span>
            </Button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {actionSuccess && (
          <div
            role="status"
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* Global Error Alert Banner */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs text-rose-300"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={fetchData}
              className="text-xs shrink-0 py-1"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Real Pipeline Statistics Grid (from GET /api/internships/stats) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pipeline Stage Overview
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">
              Live from /api/internships/stats
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {/* Total */}
            <div
              onClick={() => setSelectedStatus("ALL")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "ALL"
                  ? "bg-[#181D2E] border-pink-500/60 ring-1 ring-pink-500/40"
                  : "bg-[#11141E] border-[#202536] hover:border-[#2E364E]"
              }`}
            >
              <span className="text-[11px] font-medium text-slate-400 block">Total</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {isLoading ? "-" : stats?.total ?? internships.length}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">In pipeline</span>
            </div>

            {/* Saved */}
            <div
              onClick={() => setSelectedStatus("Saved")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "Saved"
                  ? "bg-[#181D2E] border-slate-400 ring-1 ring-slate-400/40"
                  : "bg-[#11141E] border-[#202536] hover:border-[#2E364E]"
              }`}
            >
              <span className="text-[11px] font-medium text-slate-400 block">Saved</span>
              <span className="text-xl font-bold text-slate-200 mt-1 block">
                {isLoading ? "-" : stats?.Saved ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Bookmarked</span>
            </div>

            {/* Applied */}
            <div
              onClick={() => setSelectedStatus("Applied")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "Applied"
                  ? "bg-[#181D2E] border-sky-400 ring-1 ring-sky-400/40"
                  : "bg-[#11141E] border-[#202536] hover:border-[#2E364E]"
              }`}
            >
              <span className="text-[11px] font-medium text-sky-400 block">Applied</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {isLoading ? "-" : stats?.Applied ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Under review</span>
            </div>

            {/* Assessment */}
            <div
              onClick={() => setSelectedStatus("Assessment")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "Assessment"
                  ? "bg-[#181D2E] border-purple-400 ring-1 ring-purple-400/40"
                  : "bg-[#11141E] border-[#202536] hover:border-[#2E364E]"
              }`}
            >
              <span className="text-[11px] font-medium text-purple-400 block">Assessment</span>
              <span className="text-xl font-bold text-white mt-1 block">
                {isLoading ? "-" : stats?.Assessment ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">OA / Take-home</span>
            </div>

            {/* Interview */}
            <div
              onClick={() => setSelectedStatus("Interview")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                selectedStatus === "Interview"
                  ? "bg-[#1D172A] border-pink-500 ring-2 ring-pink-500/50"
                  : "bg-[#14121F] border-pink-500/30 hover:border-pink-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-pink-400 block">Interview</span>
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              </div>
              <span className="text-xl font-bold text-white mt-1 block">
                {isLoading ? "-" : stats?.Interview ?? 0}
              </span>
              <span className="text-[10px] text-pink-300/70 mt-0.5 block">Live rounds</span>
            </div>

            {/* Selected */}
            <div
              onClick={() => setSelectedStatus("Selected")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "Selected"
                  ? "bg-[#11241C] border-emerald-500 ring-2 ring-emerald-500/50"
                  : "bg-[#0E1A17] border-emerald-500/30 hover:border-emerald-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-400 block">Selected</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white mt-1 block">
                {isLoading ? "-" : stats?.Selected ?? 0}
              </span>
              <span className="text-[10px] text-emerald-300/70 mt-0.5 block">Offer extended!</span>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setSelectedStatus("Rejected")}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedStatus === "Rejected"
                  ? "bg-[#181D2E] border-rose-400 ring-1 ring-rose-400/40"
                  : "bg-[#11141E] border-[#202536] hover:border-[#2E364E]"
              }`}
            >
              <span className="text-[11px] font-medium text-rose-400 block">Rejected</span>
              <span className="text-xl font-bold text-slate-300 mt-1 block">
                {isLoading ? "-" : stats?.Rejected ?? 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Archived</span>
            </div>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="p-4 rounded-xl bg-[#11141E] border border-[#202536] space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by company, role, location, or notes..."
                className="w-full bg-[#0A0C13] border border-[#202536] rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "newest" | "company" | "deadline")
                }
                className="bg-[#0A0C13] border border-[#202536] rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              >
                <option value="newest">Recently Added</option>
                <option value="company">Company (A-Z)</option>
                <option value="deadline">Upcoming Deadline</option>
              </select>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-[11px] text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                selectedStatus === "ALL"
                  ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                  : "bg-[#181D2E] text-slate-400 hover:text-white"
              }`}
            >
              All ({internships.length})
            </button>
            {STATUS_OPTIONS.map((st) => {
              const count = internships.filter((i) => i.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedStatus === st
                      ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                      : "bg-[#181D2E] text-slate-400 hover:text-white"
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications List */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#11141E] border border-[#1E2333] space-y-3 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="w-24 h-4 bg-[#1B2030] rounded" />
                    <div className="w-40 h-5 bg-[#1B2030] rounded" />
                  </div>
                  <div className="w-16 h-6 bg-[#1B2030] rounded-full" />
                </div>
                <div className="w-32 h-3 bg-[#1B2030] rounded" />
                <div className="w-full h-8 bg-[#1B2030] rounded mt-4" />
              </div>
            ))}
          </div>
        ) : filteredInternships.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#11141E] border border-dashed border-[#252C42] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
                {searchQuery || selectedStatus !== "ALL"
                  ? "No matching applications found"
                  : "Your pipeline is waiting for its first entry"}
              </h3>
              <p className="text-xs text-slate-400">
                {searchQuery || selectedStatus !== "ALL"
                  ? "Try clearing your search query or switching your status filter to see other applications."
                  : "Track every engineering application, interview round, deadline, and referral link in one organized place."}
              </p>
            </div>
            {searchQuery || selectedStatus !== "ALL" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("ALL");
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Track Your First Application</span>
              </Button>
            )}
          </div>
        ) : (
          /* Application Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInternships.map((app) => (
              <Card
                key={app.id}
                className="bg-[#11141E] border-[#202536] hover:border-[#2D354E] transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-pink-400 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-pink-400/80" />
                        {app.company}
                      </span>
                      <CardTitle className="text-base font-bold text-white leading-tight">
                        {app.role}
                      </CardTitle>
                    </div>
                    {renderStatusBadge(app.status)}
                  </div>

                  {app.location && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{app.location}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Dates Row */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-lg bg-[#0C0F17] border border-[#191D2C]">
                    <div>
                      <span className="text-slate-500 block">Applied Date</span>
                      <span className="text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formatDate(app.application_date) || "Not logged"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Deadline</span>
                      <span className="text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatDate(app.deadline) || "Rolling / None"}
                      </span>
                    </div>
                  </div>

                  {/* Notes Snippet */}
                  {app.notes && (
                    <div className="p-2.5 rounded-lg bg-[#141824] border border-[#23283B] text-xs text-slate-300 flex items-start gap-2">
                      <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-[11px] leading-relaxed">
                        {app.notes}
                      </p>
                    </div>
                  )}

                  {/* Links and Quick Status Selector */}
                  <div className="space-y-2.5 pt-1 border-t border-[#1C2030]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Change Stage:
                      </span>
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app.id, e.target.value as InternshipStatus)
                        }
                        className="bg-[#0A0D15] border border-[#252C42] rounded-md px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-pink-500"
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {app.job_url ? (
                        <a
                          href={app.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          <span>Job Listing</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-600">No URL saved</span>
                      )}

                      <button
                        type="button"
                        onClick={() => setInternshipToDelete(app)}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete application"
                        aria-label={`Delete application for ${app.role} at ${app.company}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Application Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="w-full max-w-lg bg-[#0F121C] border border-[#252C40] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-[#1E2333] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-title" className="text-base font-bold text-white">
                    Track New Internship
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Add role specifics and track recruitment stages
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Company Name *"
                  placeholder="e.g. Google, Stripe, Meta"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  required
                />
                <Input
                  label="Role Title *"
                  placeholder="e.g. Software Engineer Intern"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Location"
                  placeholder="e.g. San Francisco / Remote"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Initial Pipeline Stage
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as InternshipStatus,
                      })
                    }
                    className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-sm py-2 px-3 focus:outline-none focus:border-pink-500"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={formData.application_date}
                    onChange={(e) =>
                      setFormData({ ...formData, application_date: e.target.value })
                    }
                    className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-sm py-2 px-3 focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-sm py-2 px-3 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <Input
                label="Job Posting URL"
                type="url"
                placeholder="https://careers.company.com/job/123"
                value={formData.job_url}
                onChange={(e) =>
                  setFormData({ ...formData, job_url: e.target.value })
                }
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Notes & Interview Preparation Hints
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {formData.notes.length} / 2000
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="e.g. Alum referral, emphasized distributed systems and Python on resume..."
                  className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2333]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs border-[#252C42]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                  className="text-xs font-semibold"
                >
                  Save Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {internshipToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md bg-[#0F121C] border border-rose-500/30 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="text-base font-bold text-white">
                  Remove Application?
                </h3>
                <p className="text-xs text-slate-400">
                  Delete application for <span className="text-white font-medium">{internshipToDelete.role}</span> at{" "}
                  <span className="text-pink-400 font-medium">{internshipToDelete.company}</span>.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed bg-[#151824] p-3 rounded-lg border border-[#22283A]">
              This action will permanently delete this application record from your database pipeline.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInternshipToDelete(null)}
                disabled={isDeleting}
                className="text-xs border-[#252C42]"
              >
                Keep Record
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                className="text-xs"
              >
                Yes, Delete Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
