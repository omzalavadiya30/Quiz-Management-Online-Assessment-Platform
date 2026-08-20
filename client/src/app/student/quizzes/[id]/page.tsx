"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, CircleHelp, Play } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Quiz = { id: string; title: string; description?: string; difficulty: string; duration: number; passing_score: number; max_attempts: number; question_count: number; categories?: { name: string } };

export default function StudentQuizDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/student/quizzes/${params.id}`, { credentials: "include" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load quiz"); setQuiz(data.quiz); }).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, [params.id]);

  const startQuiz = async () => { try { setStarting(true); const response = await fetch(`${API_URL}/student/quizzes/${params.id}/start`, { method: "POST", credentials: "include" }); const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to start quiz"); router.push(`/student/attempt/${data.attempt.id}`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to start quiz"); } finally { setStarting(false); } };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-violet-300">Loading quiz...</main>;
  if (!quiz) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-slate-400">Quiz not found.</main>;
  return <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10"><div className="mx-auto max-w-4xl"><Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back to quizzes</Link><section className="mt-8 rounded-[32px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl sm:p-10"><span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">{quiz.categories?.name || "General"}</span><h1 className="mt-6 text-4xl font-black">{quiz.title}</h1><p className="mt-4 text-lg leading-8 text-slate-400">{quiz.description || "Test your knowledge with this assessment."}</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><Clock3 className="text-violet-300" size={20} /><p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Duration</p><strong className="mt-1 block text-lg">{quiz.duration} minutes</strong></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><CircleHelp className="text-violet-300" size={20} /><p className="mt-3 text-xs uppercase tracking-wider text-slate-500">Questions</p><strong className="mt-1 block text-lg">{quiz.question_count}</strong></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Difficulty</p><strong className="mt-1 block text-lg">{quiz.difficulty}</strong></div><div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">Passing score</p><strong className="mt-1 block text-lg">{quiz.passing_score}%</strong></div></div><button onClick={startQuiz} disabled={starting || quiz.question_count === 0} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-4 font-semibold hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Play size={18} />{starting ? "Starting quiz..." : "Start quiz"}</button></section></div></main>;
}
