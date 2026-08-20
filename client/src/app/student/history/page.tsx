"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, ChevronRight, Clock3, History, Trophy, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type HistoryItem = { attempt_id: string; quiz: { title: string }; percentage: number; status: "PASSED" | "FAILED"; correct_answers: number; total_questions: number; time_taken_seconds: number; submitted_at: string };

export default function StudentHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await fetch(`${API_URL}/student/quizzes/attempts/history`, { credentials: "include" });
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(data.message || "Unable to load attempt history");
                } 
                setHistory(data.history || []);
            } catch (error) {
                toast.error(error instanceof Error ? error.message : "Unable to load attempt history");
            } finally {
                setLoading(false);
            }
        };
        loadHistory();
    }, [router]);

    const averageScore = useMemo(() => (
        history.length ? Math.round(history.reduce((total, item) => total + item.percentage, 0) / history.length) : 0
    ), [history])

    const passedCount = history.filter((item) => item.status === "PASSED").length;

    return (
        <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10">
            <div className="mx-auto max-w-6xl">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
                        <ArrowLeft size={16} /> Back to quizzes
                    </Link>
                    <div className="inline-flex items-center gap-2 text-violet-300">
                        <History size={18} />
                        <span className="text-sm font-semibold">Your learning record</span>
                    </div>
                </div>
                <header className="mt-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Student workspace</p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight">Attempt history</h1>
                    <p className="mt-2 max-w-2xl text-slate-400">Revisit your results, track your progress, and keep sharpening your understanding.</p>
                </header>
                
                <section className="mt-8 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">Total attempts</p>
                            <BarChart3 className="text-violet-300" size={20} />
                        </div>
                        <p className="mt-3 text-3xl font-black">{history.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">Average score</p>
                            <Trophy className="text-amber-300" size={20} />
                        </div>
                        <p className="mt-3 text-3xl font-black text-amber-300">{averageScore}%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-400">Passed quizzes</p>
                            <CheckCircle2 className="text-emerald-300" size={20} />
                        </div>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{passedCount}</p>
                    </div>
                </section>

                <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60">
                    {
                        loading ? (
                            <div className="p-16 text-center text-violet-300">Loading your attempts...</div>
                        ) : history.length === 0 ? (
                                <div className="p-16 text-center">
                                    <History className="mx-auto text-slate-600" size={40} />
                                    <h2 className="mt-4 text-xl font-bold">No completed attempts yet</h2>
                                    <p className="mt-2 text-sm text-slate-400">Finish your first quiz and its result will appear here.</p>
                                    <Link href="/student/quizzes" className="mt-6 inline-flex rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold">
                                        Find a quiz
                                    </Link>
                                </div>
                            ) : (
                        <div className="divide-y divide-white/10">
                            {
                                history.map((item) => {
                                    const minutes = Math.floor(item.time_taken_seconds / 60);
                                    const seconds = item.time_taken_seconds % 60;
                                    const passed = item.status === "PASSED";

                                    return (
                                        <Link key={item.attempt_id}href={`/student/result/${item.attempt_id}`} className="flex flex-col gap-4 p-5 transition hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                                                    {passed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <h2 className="font-bold text-white">{item.quiz.title}</h2>
                                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                                                        <span>{new Date(item.submitted_at).toLocaleDateString()}</span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Clock3 size={13} /> {minutes}:{String(seconds).padStart(2, "0")}
                                                        </span>
                                                        <span>{item.correct_answers}/{item.total_questions} correct</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-5 sm:justify-end">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-2xl font-black text-white">{item.percentage}%</p>
                                                    <p className={`text-xs font-bold uppercase tracking-wider ${passed ? "text-emerald-300" : "text-red-300"}`}>
                                                        {item.status}
                                                    </p>
                                                </div>
                                                <ChevronRight className="text-slate-500" size={20} />
                                            </div>
                                        </Link>
                                    );
                                })
                            }
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}