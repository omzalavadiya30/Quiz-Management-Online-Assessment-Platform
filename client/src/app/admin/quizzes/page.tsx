"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Pencil, Trash2, Plus, Eye, EyeOff, Search, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Category = {
  id: string;
  name: string;
  description?: string;
};

type Quiz = {
  id: string;
  title: string;
  description?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  duration: number;
  passing_score: number;
  max_attempts: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  category_id: string;
  categories?: Category;
  created_at?: string;
  updated_at?: string;
};

type QuizFormState = {
  title: string;
  description: string;
  category_id: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  duration: number;
  passing_score: number;
  max_attempts: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

const emptyForm: QuizFormState = {
  title: "",
  description: "",
  category_id: "",
  difficulty: "MEDIUM",
  duration: 30,
  passing_score: 60,
  max_attempts: 1,
  status: "DRAFT",
};

export default function AdminQuizPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuizFormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof QuizFormState, string>>>({});

  const filteredQuizzes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return quizzes;

    return quizzes.filter((quiz) => {
      return (
        quiz.title.toLowerCase().includes(query) ||
        quiz.categories?.name?.toLowerCase().includes(query) ||
        quiz.status.toLowerCase().includes(query)
      );
    });
  }, [quizzes, search]);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        if (!res.ok) {
          router.push("/auth/login");
          return;
        }

        const me = await res.json();
        if (me?.user?.role !== "ADMIN") {
          router.push("/dashboard");
          return;
        }

        await Promise.all([loadCategories(), loadQuizzes()]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load admin quiz settings");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [router]);

  const loadCategories = async () => {
    const res = await fetch(`${API_URL}/categories`, { credentials: "include" });
    if (!res.ok) {
      throw new Error("Unable to load categories");
    }

    const data = await res.json();
    setCategories(data?.categories || []);
  };

  const loadQuizzes = async () => {
    const res = await fetch(`${API_URL}/quizzes`, { credentials: "include" });
    if (!res.ok) {
      throw new Error("Unable to load quizzes");
    }

    const data = await res.json();
    setQuizzes(data?.quizzes || []);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  };

  const handleChange = (field: keyof QuizFormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<keyof QuizFormState, string>> = {};

    if (!form.title.trim()) nextErrors.title = "Quiz title is required";
    if (!form.description.trim()) nextErrors.description = "Description is required";
    if (!form.category_id) nextErrors.category_id = "Please select a category";
    if (!Number.isFinite(form.duration) || form.duration <= 0) nextErrors.duration = "Duration must be greater than 0";
    if (!Number.isFinite(form.passing_score) || form.passing_score < 0 || form.passing_score > 100) {
      nextErrors.passing_score = "Passing score must be between 0 and 100";
    }
    if (!Number.isFinite(form.max_attempts) || form.max_attempts <= 0) nextErrors.max_attempts = "Max attempts must be at least 1";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
      };

      const url = editingId ? `${API_URL}/quizzes/${editingId}` : `${API_URL}/quizzes`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Unable to save quiz");
      }

      toast.success(editingId ? "Quiz updated successfully" : "Quiz created successfully");
      await loadQuizzes();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save quiz");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (quiz: Quiz) => {
    setForm({
      title: quiz.title,
      description: quiz.description || "",
      category_id: quiz.category_id,
      difficulty: quiz.difficulty,
      duration: quiz.duration,
      passing_score: quiz.passing_score,
      max_attempts: quiz.max_attempts,
      status: quiz.status,
    });
    setEditingId(quiz.id);
    setShowForm(true);
  };

  const handleDelete = async (quizId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this quiz?");
    if (!confirmed) return;

    try {
      const res = await fetch(`${API_URL}/quizzes/${quizId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Unable to delete quiz");
      }

      toast.success("Quiz deleted successfully");
      setQuizzes((prev) => prev.filter((item) => item.id !== quizId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete quiz");
    }
  };

  const handlePublishToggle = async (quiz: Quiz) => {
    const nextPublished = quiz.status !== "PUBLISHED";

    try {
      const res = await fetch(`${API_URL}/quizzes/${quiz.id}/publish`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextPublished }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Unable to update quiz status");
      }

      toast.success(nextPublished ? "Quiz published successfully" : "Quiz unpublished successfully");
      setQuizzes((prev) =>
        prev.map((item) =>
          item.id === quiz.id ? { ...item, status: nextPublished ? "PUBLISHED" : "DRAFT" } : item
        )
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update quiz status");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Logout request failed");
      }

      toast.success(data.message || "Logged out successfully.");
      router.push("/auth/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to log out. Please try again.";
      toast.error(message);
    }
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300/90">Quiz Management</p>
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Quizzes</h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(124,58,237,0.35)] transition hover:brightness-110"
          >
            <Plus size={18} />
            Create Quiz
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-65 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="text-sm font-medium uppercase tracking-[0.28em] text-violet-300">Loading quizzes...</div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[26px] border border-white/10 bg-[#071a2e] px-5 py-6 shadow-[0_12px_28px_rgba(2,6,23,0.25)]">
                <p className="text-[16px] font-medium text-slate-300">Total Quizzes</p>
                <p className="mt-6 text-6xl font-black leading-none tracking-tight text-white">{quizzes.length}</p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-[#071a2e] px-5 py-6 shadow-[0_12px_28px_rgba(2,6,23,0.25)]">
                <p className="text-[16px] font-medium text-slate-300">Published</p>
                <p className="mt-6 text-6xl font-black leading-none tracking-tight text-emerald-300">
                  {quizzes.filter((q) => q.status === "PUBLISHED").length}
                </p>
              </div>
              <div className="rounded-[26px] border border-white/10 bg-[#071a2e] px-5 py-6 shadow-[0_12px_28px_rgba(2,6,23,0.25)]">
                <p className="text-[16px] font-medium text-slate-300">Drafts</p>
                <p className="mt-6 text-6xl font-black leading-none tracking-tight text-amber-300">
                  {quizzes.filter((q) => q.status === "DRAFT").length}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.35)] md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Quiz List</h2>
                </div>

                <div className="relative w-full md:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search quizzes"
                    className="w-full rounded-xl border border-white/10 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3 text-left">
                  <thead>
                    <tr className="text-sm text-slate-400">
                      <th className="px-3 py-2 font-medium">Title</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Difficulty</th>
                      <th className="px-3 py-2 font-medium">Duration</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuizzes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-400">
                          No quizzes found
                        </td>
                      </tr>
                    ) : (
                      filteredQuizzes.map((quiz) => (
                        <tr key={quiz.id} className="rounded-2xl bg-slate-950/35 text-slate-200">
                          <td className="rounded-l-2xl border-y border-l border-white/10 px-3 py-4">
                            <div>
                              <p className="font-semibold text-white">{quiz.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{quiz.description || "No description"}</p>
                            </div>
                          </td>
                          <td className="border-y border-white/10 px-3 py-4 text-sm">{quiz.categories?.name || "Uncategorized"}</td>
                          <td className="border-y border-white/10 px-3 py-4 text-sm">{quiz.difficulty}</td>
                          <td className="border-y border-white/10 px-3 py-4 text-sm">{quiz.duration} min</td>
                          <td className="border-y border-white/10 px-3 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                quiz.status === "PUBLISHED"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : quiz.status === "ARCHIVED"
                                    ? "bg-slate-500/15 text-slate-300"
                                    : "bg-amber-500/15 text-amber-300"
                              }`}
                            >
                              {quiz.status}
                            </span>
                          </td>
                          <td className="rounded-r-2xl border-y border-r border-white/10 px-3 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handlePublishToggle(quiz)}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                                  quiz.status === "PUBLISHED"
                                    ? "bg-slate-700 text-slate-100 hover:bg-slate-600"
                                    : "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20"
                                }`}
                              >
                                {quiz.status === "PUBLISHED" ? <EyeOff size={14} /> : <Eye size={14} />}
                                {quiz.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEdit(quiz)}
                                className="inline-flex items-center gap-1 rounded-lg bg-sky-500/15 px-2.5 py-2 text-xs font-medium text-sky-300 hover:bg-sky-500/20"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(quiz.id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-2 text-xs font-medium text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md sm:p-6">
          <div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#071a2e] shadow-[0_25px_70px_rgba(15,23,42,0.8)] sm:max-h-[calc(100vh-3rem)] sm:rounded-[28px]">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-violet-300">Quiz management</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">{editingId ? "Edit Quiz" : "Create Quiz"}</h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-800/70 text-slate-300 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400/60 sm:h-11 sm:w-11"
                aria-label="Close quiz form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:space-y-5 sm:px-7 sm:py-6">
                <div>
                  <label htmlFor="quiz-title" className="mb-2 block text-sm font-medium text-slate-300">Quiz Title</label>
                  <input
                    id="quiz-title"
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    aria-invalid={Boolean(errors.title)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    placeholder="JavaScript Fundamentals"
                  />
                  <p className={`mt-1 min-h-5 text-xs ${errors.title ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.title || " "}</p>
                </div>

                <div>
                  <label htmlFor="quiz-description" className="mb-2 block text-sm font-medium text-slate-300">Description</label>
                  <textarea
                    id="quiz-description"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={3}
                    aria-invalid={Boolean(errors.description)}
                    className="min-h-28 w-full resize-y rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    placeholder="Describe what this quiz covers and what students should expect."
                  />
                  <p className={`mt-1 min-h-5 text-xs ${errors.description ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.description || " "}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Category</label>
                    <div className="relative">
                      <select
                        id="quiz-category"
                        value={form.category_id}
                        onChange={(e) => handleChange("category_id", e.target.value)}
                        aria-invalid={Boolean(errors.category_id)}
                        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 pr-10 text-base font-medium text-slate-100 outline-none transition hover:border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                        style={{
                          backgroundImage: "linear-gradient(45deg, transparent 50%, #cbd5e1 50%), linear-gradient(135deg, #cbd5e1 50%, transparent 50%)",
                          backgroundPosition: "calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px)",
                          backgroundSize: "5px 5px, 5px 5px",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <option value="" className="bg-slate-900 text-slate-300">
                          Select category
                        </option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id} className="bg-slate-900 text-slate-100">
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className={`mt-1 min-h-5 text-xs ${errors.category_id ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.category_id || " "}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Difficulty</label>
                    <div className="relative">
                      <select
                        id="quiz-difficulty"
                        value={form.difficulty}
                        onChange={(e) => handleChange("difficulty", e.target.value as QuizFormState["difficulty"])}
                        className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 pr-10 text-base font-medium text-slate-100 outline-none transition hover:border-white/15 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                        style={{
                          backgroundImage: "linear-gradient(45deg, transparent 50%, #cbd5e1 50%), linear-gradient(135deg, #cbd5e1 50%, transparent 50%)",
                          backgroundPosition: "calc(100% - 18px) calc(50% - 2px), calc(100% - 13px) calc(50% - 2px)",
                          backgroundSize: "5px 5px, 5px 5px",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <option value="EASY" className="bg-slate-900 text-slate-100">Easy</option>
                        <option value="MEDIUM" className="bg-slate-900 text-slate-100">Medium</option>
                        <option value="HARD" className="bg-slate-900 text-slate-100">Hard</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Duration (minutes)</label>
                    <input
                      id="quiz-duration"
                      type="number"
                      min={1}
                      value={form.duration}
                      onChange={(e) => handleChange("duration", Number(e.target.value))}
                      aria-invalid={Boolean(errors.duration)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    />
                    <p className={`mt-1 min-h-5 text-xs ${errors.duration ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.duration || " "}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Passing Score (%)</label>
                    <input
                      id="quiz-passing-score"
                      type="number"
                      min={0}
                      max={100}
                      value={form.passing_score}
                      onChange={(e) => handleChange("passing_score", Number(e.target.value))}
                      aria-invalid={Boolean(errors.passing_score)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    />
                    <p className={`mt-1 min-h-5 text-xs ${errors.passing_score ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.passing_score || " "}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Max Attempts</label>
                    <input
                      id="quiz-max-attempts"
                      type="number"
                      min={1}
                      value={form.max_attempts}
                      onChange={(e) => handleChange("max_attempts", Number(e.target.value))}
                      aria-invalid={Boolean(errors.max_attempts)}
                      className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    />
                    <p className={`mt-1 min-h-5 text-xs ${errors.max_attempts ? "text-red-400" : "text-transparent"}`} aria-live="polite">{errors.max_attempts || " "}</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-300">Status</label>
                    <select
                      id="quiz-status"
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value as QuizFormState["status"])}
                      className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-400/15"
                    >
                      <option value="DRAFT" className="bg-slate-900 text-slate-100">Draft</option>
                      <option value="PUBLISHED" className="bg-slate-900 text-slate-100">Published</option>
                      <option value="ARCHIVED" className="bg-slate-900 text-slate-100">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 bg-[#071a2e] px-5 py-4 sm:px-7 sm:py-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 bg-slate-800 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-linear-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(99,102,241,0.28)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300/60 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? (editingId ? "Updating..." : "Creating...") : editingId ? "Save Changes" : "Create Quiz"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
