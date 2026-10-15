"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  StickyNote,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  X,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { apiClient, ApiError } from "@/lib/api-client";
import type { Note, NoteCreate, NoteUpdate } from "@/lib/types/notes";

const POPULAR_CATEGORIES = [
  "General",
  "Interview Prep",
  "System Design",
  "Algorithms",
  "Behavioral",
  "Cheat Sheet",
];

export default function NotesPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();

  // Primary data states
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search & category filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Create / Edit modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Read note modal state
  const [readingNote, setReadingNote] = useState<Note | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Delete modal state
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form input states
  const [formData, setFormData] = useState<{
    title: string;
    category: string;
    content: string;
  }>({
    title: "",
    category: "General",
    content: "",
  });

  // Protected route guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/notes");
    }
  }, [authLoading, isAuthenticated, router]);

  // Initial load of notes
  useEffect(() => {
    let ignore = false;
    if (!isAuthenticated || !token) return;

    apiClient
      .getNotes(token)
      .then((data) => {
        if (!ignore) {
          setNotes(data);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError("Failed to load engineering notes. Please try again.");
          }
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  // Explicit user-triggered sync
  const fetchNotes = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.getNotes(token);
      setNotes(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load engineering notes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Open modal for new note
  const handleOpenCreateModal = () => {
    setEditingNote(null);
    setFormData({
      title: "",
      category: "General",
      content: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing note
  const handleOpenEditModal = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      category: note.category || "General",
      content: note.content,
    });
    setModalError(null);
    if (readingNote) setReadingNote(null);
    setIsModalOpen(true);
  };

  // Handle Form Submit (Create or Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (formData.title.trim().length < 1) {
      setModalError("Please provide a note title.");
      return;
    }
    if (formData.content.trim().length < 1) {
      setModalError("Please write note content.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload: NoteCreate | NoteUpdate = {
      title: formData.title.trim(),
      category: formData.category.trim() || "General",
      content: formData.content.trim(),
    };

    try {
      if (editingNote) {
        // Update existing note
        const updated = await apiClient.updateNote(editingNote.id, payload, token);
        setNotes((prev) =>
          prev.map((n) => (n.id === editingNote.id ? updated : n))
        );
        setActionSuccess(`Note "${updated.title}" updated successfully.`);
      } else {
        // Create new note
        const created = await apiClient.createNote(payload, token);
        setNotes((prev) => [created, ...prev]);
        setActionSuccess(`Note "${created.title}" created!`);
      }

      setIsModalOpen(false);
      setEditingNote(null);
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err) {
      if (err instanceof ApiError) {
        setModalError(err.message);
      } else {
        setModalError("Failed to save note. Please check inputs and retry.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!token || !noteToDelete) return;
    setIsDeleting(true);

    try {
      await apiClient.deleteNote(noteToDelete.id, token);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete.id));
      setActionSuccess(`Note "${noteToDelete.title}" deleted.`);
      setTimeout(() => setActionSuccess(null), 3500);
      setNoteToDelete(null);
      if (readingNote?.id === noteToDelete.id) {
        setReadingNote(null);
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to delete note";
      setError(msg);
      setNoteToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy content to clipboard
  const handleCopyContent = (note: Note) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Get all unique categories across notes
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    POPULAR_CATEGORIES.forEach((c) => set.add(c));
    notes.forEach((n) => {
      if (n.category) set.add(n.category);
    });
    return Array.from(set);
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesQuery =
        searchQuery.trim() === "" ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "ALL" || n.category === selectedCategory;

      return matchesQuery && matchesCat;
    });
  }, [notes, searchQuery, selectedCategory]);

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
          <span className="text-slate-200 font-medium">Engineering Notes</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E2333] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <Badge variant="pink" size="sm">
                Engineering Notebook
              </Badge>
              <span className="text-xs text-slate-500 font-mono">
                {notes.length} notes saved
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <StickyNote className="w-7 h-7 text-pink-400" />
              <span>Study, Interview & Architecture Notes</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Preserve your technical knowledge, system design breakdowns, algorithmic cheatsheets, and behavioral reflections.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotes}
              disabled={isLoading}
              className="text-xs border-[#252C42]"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin text-pink-400" : ""}`} />
              <span>Sync</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              className="text-xs font-semibold shadow-lg shadow-pink-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>New Note</span>
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

        {/* Error Alert Banner */}
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
              onClick={fetchNotes}
              className="text-xs shrink-0 py-1"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Search & Category Filter Controls */}
        <div className="p-4 rounded-xl bg-[#11141E] border border-[#202536] space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes by title, topic, or content..."
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
            <span className="text-[11px] text-slate-500 uppercase mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Topic:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                selectedCategory === "ALL"
                  ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                  : "bg-[#181D2E] text-slate-400 hover:text-white"
              }`}
            >
              All Notes ({notes.length})
            </button>
            {availableCategories.map((cat) => {
              const count = notes.filter((n) => n.category === cat).length;
              if (count === 0 && selectedCategory !== cat) return null;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                    selectedCategory === cat
                      ? "bg-pink-500 text-white shadow-sm shadow-pink-500/30"
                      : "bg-[#181D2E] text-slate-400 hover:text-white"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          /* Loading Skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#11141E] border border-[#1E2333] space-y-3 animate-pulse"
              >
                <div className="w-20 h-5 bg-[#1B2030] rounded-full" />
                <div className="w-48 h-6 bg-[#1B2030] rounded" />
                <div className="space-y-1.5 pt-2">
                  <div className="w-full h-3 bg-[#1B2030] rounded" />
                  <div className="w-5/6 h-3 bg-[#1B2030] rounded" />
                  <div className="w-2/3 h-3 bg-[#1B2030] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Empty State */
          <div className="p-12 rounded-2xl bg-[#11141E] border border-dashed border-[#252C42] text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 mx-auto">
              <StickyNote className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">
                {searchQuery || selectedCategory !== "ALL"
                  ? "No notes matched your search"
                  : "Your technical notebook is clean"}
              </h3>
              <p className="text-xs text-slate-400">
                {searchQuery || selectedCategory !== "ALL"
                  ? "Try searching for a different keyword or select 'All Notes' to see your complete collection."
                  : "Save your algorithmic tricks, Redis caching patterns, behavioral anecdotes, and interview retrospectives."}
              </p>
            </div>
            {searchQuery || selectedCategory !== "ALL" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                }}
                className="text-xs"
              >
                Reset Filters
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Create Your First Note</span>
              </Button>
            )}
          </div>
        ) : (
          /* Notes Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="bg-[#11141E] border-[#202536] hover:border-[#2D354E] transition-all flex flex-col justify-between group"
              >
                <CardHeader className="pb-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#161B2B] text-pink-300 border border-pink-500/30">
                      <Tag className="w-2.5 h-2.5" />
                      {note.category || "General"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyContent(note)}
                      className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                      title="Copy note content"
                      aria-label={`Copy note ${note.title}`}
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <CardTitle className="text-base font-bold text-white group-hover:text-pink-300 transition-colors leading-snug">
                    {note.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-4 whitespace-pre-wrap font-sans bg-[#0C0F17] p-3 rounded-lg border border-[#191D2C]">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1C2030] text-xs">
                    <button
                      type="button"
                      onClick={() => setReadingNote(note)}
                      className="inline-flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300 font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Note</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(note)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2033] transition-colors"
                        title="Edit note"
                        aria-label={`Edit note ${note.title}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteToDelete(note)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete note"
                        aria-label={`Delete note ${note.title}`}
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

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="note-modal-title"
            className="w-full max-w-lg bg-[#0F121C] border border-[#252C40] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-center justify-between border-b border-[#1E2333] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="note-modal-title" className="text-base font-bold text-white">
                    {editingNote ? "Edit Note" : "Create Technical Note"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Record study takeaways and interview references
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Title *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {formData.title.length} / 200
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Distributed Caching with Redis & Consistency Tradeoffs"
                  className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-sm py-2 px-3 placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Category / Topic
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. System Design, Interview Prep, Algorithms"
                  className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-xs py-2 px-3 placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
                {/* Category quick chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_CATEGORIES.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: chip })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        formData.category === chip
                          ? "bg-pink-500/20 text-pink-300 border-pink-500/40"
                          : "bg-[#141826] text-slate-400 border-[#23283B] hover:text-white"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-300">
                    Content *
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {formData.content.length} / 5000
                  </span>
                </div>
                <textarea
                  rows={8}
                  maxLength={5000}
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Write code snippets, architectural notes, key algorithmic nuances, or STAR interview examples..."
                  className="w-full rounded-lg bg-[#0E111B] border border-[#23283B] text-slate-100 text-xs p-3 placeholder:text-slate-500 focus:outline-none focus:border-pink-500 resize-none font-sans leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E2333]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
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
                  {editingNote ? "Update Note" : "Save Note"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Note Modal */}
      {readingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reader-title"
            className="w-full max-w-2xl bg-[#0F121C] border border-[#252C40] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 overflow-y-auto max-h-[90vh]"
          >
            <div className="flex items-start justify-between border-b border-[#1E2333] pb-3 gap-3">
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#161B2B] text-pink-300 border border-pink-500/30">
                  <Tag className="w-2.5 h-2.5" />
                  {readingNote.category || "General"}
                </span>
                <h3 id="reader-title" className="text-lg font-bold text-white">
                  {readingNote.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReadingNote(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0A0D15] p-4 rounded-xl border border-[#1E2436] max-h-[50vh] overflow-y-auto">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {readingNote.content}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#1E2333]">
              <button
                type="button"
                onClick={() => handleCopyContent(readingNote)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white"
              >
                {copiedId === readingNote.id ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Full Note</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(readingNote)}
                  className="text-xs border-[#252C42]"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  <span>Edit Note</span>
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setReadingNote(null)}
                  className="text-xs"
                >
                  Done Reading
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-note-title"
            className="w-full max-w-md bg-[#0F121C] border border-rose-500/30 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-note-title" className="text-base font-bold text-white">
                  Delete Note?
                </h3>
                <p className="text-xs text-slate-400 line-clamp-1">
                  &quot;{noteToDelete.title}&quot;
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed bg-[#151824] p-3 rounded-lg border border-[#22283A]">
              This note will be permanently removed from your engineering knowledge base.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeleting}
                className="text-xs border-[#252C42]"
              >
                Keep Note
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                isLoading={isDeleting}
                className="text-xs"
              >
                Yes, Delete Note
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
