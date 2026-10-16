"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  Flame,
  Calendar,
  BookOpen,
  Sparkles,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient, ApiError } from "@/lib/api-client";
import type { StudySession, StudyStats } from "@/lib/types/auth";

interface StudyTimerProps {
  token: string | null;
  courses?: Array<{ id: number; title: string }>;
  onSessionCompleted?: () => void;
}

function formatDuration(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatHoursAndMins(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function StudyTimer({ token, courses = [], onSessionCompleted }: StudyTimerProps) {
  // Active session & local timer state
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Form input state
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [customSkill, setCustomSkill] = useState<string>("Python & System Design");

  // Statistics and session history
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [history, setHistory] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit session state
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editMinutes, setEditMinutes] = useState<string>("");
  const [editSkill, setEditSkill] = useState<string>("");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to re-fetch active session, stats, and history on user action
  const refreshTimerData = useCallback(async () => {
    if (!token) return;
    try {
      const [active, statsData, sessions] = await Promise.all([
        apiClient.getActiveStudySession(token),
        apiClient.getStudyStats(token),
        apiClient.getStudySessions(token),
      ]);

      setStats(statsData);
      setHistory(sessions);

      if (active) {
        setActiveSession(active);
        setElapsedSeconds(active.current_elapsed_seconds);
        setIsTimerRunning(active.is_active && !active.is_paused);
        if (active.course_id) {
          setSelectedCourseId(active.course_id);
        }
        setCustomSkill(active.skill_name);
      } else {
        setActiveSession(null);
        setElapsedSeconds(0);
        setIsTimerRunning(false);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Initial load of active session and stats on mount
  useEffect(() => {
    let ignore = false;
    if (!token) {
      Promise.resolve().then(() => {
        if (!ignore) setIsLoading(false);
      });
      return;
    }

    Promise.all([
      apiClient.getActiveStudySession(token),
      apiClient.getStudyStats(token),
      apiClient.getStudySessions(token),
    ])
      .then(([active, statsData, sessions]) => {
        if (ignore) return;
        setStats(statsData);
        setHistory(sessions);

        if (active) {
          setActiveSession(active);
          setElapsedSeconds(active.current_elapsed_seconds);
          setIsTimerRunning(active.is_active && !active.is_paused);
          if (active.course_id) {
            setSelectedCourseId(active.course_id);
          }
          setCustomSkill(active.skill_name);
        } else {
          setActiveSession(null);
          setElapsedSeconds(0);
          setIsTimerRunning(false);
        }
      })
      .catch((err) => {
        if (!ignore && err instanceof ApiError) {
          setErrorMessage(err.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  // Accurate ticking effect that counts up while active and not paused
  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isTimerRunning]);

  // Start study session
  const handleStart = async () => {
    if (!token || actionLoading) return;
    const skillName = customSkill.trim() || "Independent Engineering Study";

    setActionLoading(true);
    setErrorMessage(null);

    try {
      const session = await apiClient.startStudySession(
        {
          course_id: selectedCourseId,
          skill_name: skillName,
        },
        token
      );

      setActiveSession(session);
      setElapsedSeconds(session.current_elapsed_seconds);
      setIsTimerRunning(!session.is_paused);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to start study timer session.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Pause study session
  const handlePause = async () => {
    if (!token || !activeSession || actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const updated = await apiClient.pauseStudySession(activeSession.id, token);
      setActiveSession(updated);
      setElapsedSeconds(updated.current_elapsed_seconds);
      setIsTimerRunning(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Resume study session
  const handleResume = async () => {
    if (!token || !activeSession || actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const updated = await apiClient.resumeStudySession(activeSession.id, token);
      setActiveSession(updated);
      setElapsedSeconds(updated.current_elapsed_seconds);
      setIsTimerRunning(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Stop study session
  const handleStop = async () => {
    if (!token || !activeSession || actionLoading) return;
    setActionLoading(true);
    setErrorMessage(null);

    try {
      await apiClient.stopStudySession(activeSession.id, token);
      setActiveSession(null);
      setElapsedSeconds(0);
      setIsTimerRunning(false);

      // Refresh stats & history
      await refreshTimerData();
      if (onSessionCompleted) {
        onSessionCompleted();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Start editing a recorded session
  const startEditing = (session: StudySession) => {
    setEditingSessionId(session.id);
    setEditMinutes(Math.round(session.duration_seconds / 60).toString());
    setEditSkill(session.skill_name);
  };

  // Cancel edit
  const cancelEditing = () => {
    setEditingSessionId(null);
    setEditMinutes("");
    setEditSkill("");
  };

  // Save session correction
  const handleSaveEdit = async (sessionId: number) => {
    if (!token) return;
    const parsedMins = parseInt(editMinutes, 10);
    if (isNaN(parsedMins) || parsedMins < 0) {
      setErrorMessage("Please enter a valid non-negative number of minutes.");
      return;
    }

    setErrorMessage(null);
    try {
      await apiClient.updateStudySession(
        sessionId,
        {
          duration_seconds: parsedMins * 60,
          skill_name: editSkill.trim() || undefined,
        },
        token
      );
      cancelEditing();
      await refreshTimerData();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    }
  };

  // Delete session
  const handleDelete = async (sessionId: number) => {
    if (!token) return;
    setErrorMessage(null);
    try {
      await apiClient.deleteStudySession(sessionId, token);
      await refreshTimerData();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Aggregated Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Today's Focus Card */}
        <Card className="bg-[#11141E] border-[#202536]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Study Time Today</span>
              <Clock className="w-4 h-4 text-pink-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">
              {stats ? formatHoursAndMins(stats.today_study_seconds) : "0m"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400">
              Persisted from verified PostgreSQL study logs
            </p>
          </CardContent>
        </Card>

        {/* Weekly Focus Card */}
        <Card className="bg-[#11141E] border-[#202536]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>This Week&apos;s Focus</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white mt-1">
              {stats ? formatHoursAndMins(stats.week_study_seconds) : "0m"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400">
              Rolling 7-day cumulative preparation time
            </p>
          </CardContent>
        </Card>

        {/* Current Study Streak */}
        <Card className="bg-[#11141E] border-[#202536]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Daily Study Streak</span>
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-400 mt-1 flex items-center gap-1.5">
              <span>{stats?.current_streak_days ?? 0}</span>
              <span className="text-sm font-normal text-slate-400">Days</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400">
              {stats && stats.current_streak_days > 0
                ? "Streak is active! Keep studying today"
                : "Complete a session today to start your streak"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Study Timer Card */}
      <Card className="bg-[#11141E] border-[#202536] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        <CardHeader className="pb-4 border-b border-[#1C2132]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="glow" className="text-xs">
                  Active Study Timer
                </Badge>
                {activeSession && (
                  <Badge
                    variant={activeSession.is_paused ? "outline" : "pink"}
                    className="text-xs"
                  >
                    {activeSession.is_paused ? "Paused" : "Running"}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-white mt-1">
                Deep Work & Skill Tracker
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Timestamps are safely persisted to PostgreSQL. Refreshing your browser will never lose your progress.
              </CardDescription>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isTimerRunning
                    ? "bg-emerald-400 animate-pulse"
                    : activeSession?.is_paused
                    ? "bg-amber-400"
                    : "bg-slate-600"
                }`}
              />
              <span className="text-xs text-slate-400 font-medium">
                {isTimerRunning
                  ? "Timer Running"
                  : activeSession?.is_paused
                  ? "Session Paused"
                  : "Timer Standby"}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Course / Skill Selection (editable when no session is active) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-pink-400" />
                <span>Associated Course (Optional)</span>
              </label>
              <select
                disabled={Boolean(activeSession)}
                value={selectedCourseId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCourseId(val ? Number(val) : null);
                }}
                className="w-full h-10 px-3 rounded-lg bg-[#090A0F] border border-[#202536] text-xs text-white focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-60"
              >
                <option value="">-- Independent Skill / No Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Topic or Skill Tracked</span>
              </label>
              <Input
                disabled={Boolean(activeSession)}
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder="e.g. Graph Algorithms, LeetCode, System Design..."
                className="h-10 text-xs bg-[#090A0F] border-[#202536] text-white"
              />
            </div>
          </div>

          {/* Huge Timer Readout */}
          <div className="p-8 rounded-2xl bg-[#090A0F] border border-[#1C2132] flex flex-col items-center justify-center text-center space-y-4">
            <div className="font-mono text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-wider text-white">
              <span className="text-pink-400">{formatDuration(elapsedSeconds)}</span>
            </div>

            <p className="text-xs text-slate-400">
              {activeSession ? (
                <span>
                  Tracking session for{" "}
                  <strong className="text-white">{activeSession.skill_name}</strong>
                  {activeSession.course_title && ` • ${activeSession.course_title}`}
                </span>
              ) : (
                <span>Select your skill and press Start to record authenticated focus time</span>
              )}
            </p>

            {/* Control Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!activeSession ? (
                <Button
                  onClick={handleStart}
                  disabled={actionLoading}
                  variant="primary"
                  className="px-6 py-2.5 text-sm font-semibold shadow-lg shadow-pink-500/20"
                >
                  <Play className="w-4 h-4 mr-2 fill-current" />
                  <span>Start Focus Session</span>
                </Button>
              ) : (
                <>
                  {activeSession.is_paused ? (
                    <Button
                      onClick={handleResume}
                      disabled={actionLoading}
                      variant="primary"
                      className="px-5 py-2 text-xs font-semibold"
                    >
                      <Play className="w-4 h-4 mr-1.5 fill-current" />
                      <span>Resume</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePause}
                      disabled={actionLoading}
                      variant="secondary"
                      className="px-5 py-2 text-xs font-semibold"
                    >
                      <Pause className="w-4 h-4 mr-1.5" />
                      <span>Pause</span>
                    </Button>
                  )}

                  <Button
                    onClick={handleStop}
                    disabled={actionLoading}
                    variant="danger"
                    className="px-5 py-2 text-xs font-semibold"
                  >
                    <Square className="w-4 h-4 mr-1.5 fill-current" />
                    <span>Stop & Complete</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session History & Correction Section */}
      <Card className="bg-[#11141E] border-[#202536]">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-white">
              Recorded Study Session History
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Verified sessions stored in PostgreSQL. You can correct duration or delete logs anytime.
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs border-[#252B3D]">
            {history.length} Sessions
          </Badge>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-pink-400" />
              <span>Loading session history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 rounded-lg bg-[#090A0F] border border-[#1C2132] text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-semibold text-white">No Study Sessions Logged Yet</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Use the timer above to record your first deep work session. Each completed block builds your daily streak and updates your candidate stats!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1C2132] text-slate-400">
                    <th className="pb-3 font-medium">Skill / Course</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Duration</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2132]">
                  {history.map((session) => {
                    const isEditing = editingSessionId === session.id;
                    const dateStr = new Date(session.start_time).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr key={session.id} className="hover:bg-[#141824]/50 transition-colors">
                        <td className="py-3 pr-4">
                          {isEditing ? (
                            <Input
                              value={editSkill}
                              onChange={(e) => setEditSkill(e.target.value)}
                              className="h-8 text-xs bg-[#090A0F] border-[#252B3D] text-white w-48"
                            />
                          ) : (
                            <div>
                              <span className="font-semibold text-white block">
                                {session.skill_name}
                              </span>
                              {session.course_title && (
                                <span className="text-[11px] text-pink-400 block">
                                  {session.course_title}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 text-slate-400 whitespace-nowrap">
                          {dateStr}
                        </td>

                        <td className="py-3 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="number"
                                min={0}
                                value={editMinutes}
                                onChange={(e) => setEditMinutes(e.target.value)}
                                className="h-8 text-xs bg-[#090A0F] border-[#252B3D] text-white w-20"
                              />
                              <span className="text-slate-400">min</span>
                            </div>
                          ) : (
                            <Badge variant="glow" className="text-xs font-mono font-medium">
                              {formatHoursAndMins(session.duration_seconds)}
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleSaveEdit(session.id)}
                                className="h-7 px-2 text-[11px]"
                                title="Save changes"
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={cancelEditing}
                                className="h-7 px-2 text-[11px] text-slate-400"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(session)}
                                className="h-7 px-2 text-slate-400 hover:text-white"
                                title="Correct session duration"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(session.id)}
                                className="h-7 px-2 text-slate-400 hover:text-rose-400"
                                title="Delete session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
