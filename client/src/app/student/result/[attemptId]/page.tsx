"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Result = { quiz: { title: string }; percentage: number; status: string; correct_answers: number; incorrect_answers: number; unanswered: number; total_marks: number; obtained_marks: number; time_taken_seconds: number; submission_reason: string };

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

    return <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
            <Link href="/student/quizzes" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><ArrowLeft size={16} /> Back to quizzes</Link>
            
            <section className="mt-8 rounded-[32px] border border-white/10 bg-slate-900/70 p-6 text-center shadow-2xl sm:p-10">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{passed ? <CheckCircle2 size={34} /> : <XCircle size={34} />}</div>
                <p className="mt-6 text-xs uppercase tracking-[0.3em] text-violet-300">Quiz result</p>
                <h1 className="mt-2 text-3xl font-black">{result.quiz.title}</h1>
                <div className="mt-8 rounded-3xl bg-slate-950/60 p-6">
                <p className="text-sm text-slate-400">Final score</p>
                <p className="mt-2 text-6xl font-black text-white">{result.percentage}%</p>
                <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-bold ${passed ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>{result.status}</span></div><div className="mt-8 grid gap-3 sm:grid-cols-4">{[["Correct", result.correct_answers, "text-emerald-300"], ["Incorrect", result.incorrect_answers, "text-red-300"], ["Unanswered", result.unanswered, "text-amber-300"], ["Time", `${minutes}:${String(seconds).padStart(2, "0")}`, "text-violet-300"]].map(([label, value, color]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"><p className="text-xs text-slate-500">{label}</p><strong className={`mt-2 block text-xl ${color}`}>{value}</strong></div>)}</div><Link href="/student/quizzes" className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold hover:brightness-110">Browse more quizzes</Link></section></div></main>;
}
