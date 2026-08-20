"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, Clock3, History, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type ReviewItem = { question_number: number; question_id: string; question: string; selected_answer: string | null; correct_answer: string | null; is_correct: boolean; explanation: string };
type Result = { quiz: { title: string }; percentage: number; status: string; correct_answers: number; incorrect_answers: number; unanswered: number; total_questions: number; total_marks: number; obtained_marks: number; time_taken_seconds: number; submission_reason: string; submitted_at: string; review: ReviewItem[] };

export default function StudentResultPage() {
    const params = useParams<{ attemptId: string }>();
    const [result, setResult] = useState<Result | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/student/quizzes/attempts/${params.attemptId}/result`, { credentials: "include" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load result"); setResult(data.result); }).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
    }, [params.attemptId]);

    if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-violet-300">Loading result...</main>;
    if (!result) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-slate-400">Result not found.</main>;
    const minutes = Math.floor(result.time_taken_seconds / 60);
    const seconds = result.time_taken_seconds % 60;
    const passed = result.status === "PASSED";

    return (
        <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10">
            <div className="mx-auto max-w-5xl">
                <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back to quizzes</Link><Link href="/student/history" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"><History size={16} /> Attempt history</Link></div>
                <section className="mt-8 overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/70 shadow-2xl">
                    <div className="bg-linear-to-br from-violet-600/30 via-indigo-500/10 to-transparent p-6 text-center sm:p-10">
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{passed ? <CheckCircle2 size={34} /> : <XCircle size={34} />}</div>
                    <p className="mt-6 text-xs uppercase tracking-[0.3em] text-violet-300">Quiz result</p>
                    <h1 className="mt-2 text-3xl font-black">{result.quiz.title}</h1>
                    <div className="mt-8 rounded-3xl bg-slate-950/60 p-6">
                        <p className="text-sm text-slate-400">Final score</p>
                        <p className="mt-2 text-6xl font-black text-white">{result.percentage}%</p>
                        <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{result.status}</span>
                    </div>
                    <div className="mt-8 grid gap-3 sm:grid-cols-4">
                        {
                            [
                                ["Correct", result.correct_answers, "text-emerald-300"], 
                                ["Incorrect", result.incorrect_answers, "text-red-300"], 
                                ["Unanswered", result.unanswered, "text-amber-300"], 
                                ["Time", `${minutes}:${String(seconds).padStart(2, "0")}`, "text-violet-300"]
                            ].map(([label, value, color]) => 
                                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                                    <p className="text-xs text-slate-500">{label}</p>
                                    <strong className={`mt-2 block text-xl ${color}`}>{value}</strong>
                                </div>
                            )
                        }
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-slate-400"><span className="inline-flex items-center gap-2"><Clock3 size={15} /> Submitted {new Date(result.submitted_at).toLocaleString()}</span><span>• {result.obtained_marks}/{result.total_marks} marks</span></div>
                    </div>
                    <div className="border-t border-white/10 p-6 sm:p-10"><div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300">Answer review</p><h2 className="mt-2 text-2xl font-black">See how you performed</h2><p className="mt-1 text-sm text-slate-400">Review every answer, the correct response, and the reasoning behind it.</p></div><div className="space-y-4">{result.review.map((item) => <details key={item.question_id} className="group rounded-2xl border border-white/10 bg-slate-950/40 open:border-violet-400/30"><summary className="flex cursor-pointer list-none items-start gap-4 p-5"><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.is_correct ? "bg-emerald-500/15 text-emerald-300" : item.selected_answer ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300"}`}>{item.question_number}</span><span className="flex-1"><span className="block font-semibold leading-6 text-white">{item.question}</span><span className={`mt-1 block text-xs font-semibold uppercase tracking-wider ${item.is_correct ? "text-emerald-300" : item.selected_answer ? "text-red-300" : "text-amber-300"}`}>{item.is_correct ? "Correct" : item.selected_answer ? "Incorrect" : "Unanswered"}</span></span><ChevronDown className="mt-1 shrink-0 text-slate-500 transition-transform group-open:rotate-180" size={18} /></summary><div className="grid gap-3 border-t border-white/10 p-5 text-sm md:grid-cols-2"><div className="rounded-xl bg-white/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your answer</p><p className={`mt-2 font-medium ${item.is_correct ? "text-emerald-300" : item.selected_answer ? "text-red-300" : "text-amber-300"}`}>{item.selected_answer || "Not answered"}</p></div><div className="rounded-xl bg-emerald-500/5 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Correct answer</p><p className="mt-2 font-medium text-emerald-300">{item.correct_answer || "Not available"}</p></div><div className="rounded-xl bg-indigo-500/5 p-4 md:col-span-2"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explanation</p><p className="mt-2 leading-6 text-slate-300">{item.explanation}</p></div></div></details>)}</div><Link href="/student/quizzes" className="mt-8 inline-flex rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold hover:brightness-110">Browse more quizzes</Link></div>
                </section>
            </div>
        </main>
    );
}
