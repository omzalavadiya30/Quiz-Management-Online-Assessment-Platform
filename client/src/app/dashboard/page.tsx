"use client";

import Link from "next/link";
import { BarChart3, CheckCircle2, ChevronRight, CircleHelp, LogOut, Target, Trophy, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PerformanceChart from "@/components/student/PerformanceChart";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Stats = { totalQuizzesAttempted: number; totalQuizzesPassed: number; totalQuizzesFailed: number; averageScore: number; highestScore: number; totalQuestionsAnswered: number };
type Attempt = { attempt_id: string; quiz: { title: string }; percentage: number; status: "PASSED" | "FAILED"; correct_answers: number; total_questions: number; submitted_at: string };
type Dashboard = { stats: Stats; recentAttempts: Attempt[]; performance: { label: string; score: number }[] };

export default function DashboardPage() {
  const router = useRouter(); const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
      (async () => {
        try {
          const auth = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
          const me = await auth.json().catch(() => ({}));
          if (!auth.ok || me?.user?.role !== "STUDENT") {
            return router.push(me?.user?.role === "ADMIN" ? "/admin/dashboard" : "/auth/login");
          } 
          const response = await fetch(`${API_URL}/student/dashboard`, { credentials: "include" });
          const data = await response.json().catch(() => ({}));
          if (!response.ok) {
            throw new Error(data.message || "Unable to load dashboard");
          }
          setDashboard(data);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
        }
        finally {
          setLoading(false);
        }
      })();
  }, [router]);

  const logout = async () => {
    const response = await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }); 
    if (response.ok) router.push("/auth/login"); 
    else toast.error("Unable to log out");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-violet-300">Loading dashboard...</main>
    );
  }

  if (!dashboard){
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-slate-400">No dashboard data yet.</main>
    );
  } 

  const { stats, recentAttempts, performance } = dashboard;

  const cards: Array<{ label: string; value: number | string; icon: LucideIcon; color: string }> = [
    { label: "Quizzes attempted", value: stats.totalQuizzesAttempted, icon: BarChart3, color: "text-violet-300" }, 
    { label: "Average score", value: `${stats.averageScore}%`, icon: Target, color: "text-sky-300" }, 
    { label: "Highest score", value: `${stats.highestScore}%`, icon: Trophy, color: "text-amber-300" }, 
    { label: "Passed", value: stats.totalQuizzesPassed, icon: CheckCircle2, color: "text-emerald-300" }, 
    { label: "Failed", value: stats.totalQuizzesFailed, icon: XCircle, color: "text-red-300" }, 
    { label: "Questions answered", value: stats.totalQuestionsAnswered, icon: CircleHelp, color: "text-indigo-300" }
  ];

  return (
    <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Student workspace</p>
            <h1 className="mt-2 text-3xl font-black">Your dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-500 hover:text-white">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </header>
        
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {
            cards.map(({ label, value, icon: Icon, color }) => 
              <article key={label} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">{label}</p>
                  <Icon className={color} size={20} />
                </div>
                <p className={`mt-3 text-3xl font-black ${color}`}>{value}</p>
              </article>
            )
          }
        </section>
        
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-3xl border border-white/10 bg-slate-90/60 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Performance</p>
                <h2 className="mt-2 text-xl font-black">Score progression</h2>
              </div>
              <span className="text-xs text-slate-500">Last {performance.length} attempts</span>
            </div>
            <PerformanceChart data={performance} />
          </article>
          <article className="rounded-3xl border border-white/10 bg-slate-90/60 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">Activity</p>
              <h2 className="mt-2 text-xl font-black">Recent attempts</h2>
            </div>
            <Link href="/student/history" className="text-slate-400 hover:text-white" aria-label="View attempt history">
              <ChevronRight size={20} />
            </Link>
          </div>
            { 
              recentAttempts.length ? (
                <div className="mt-5 space-y-2">
                  {
                    recentAttempts.map((attempt) => (
                      <Link key={attempt.attempt_id} href={`/student/result/${attempt.attempt_id}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 p-3 hover:bg-white/5">
                        <div>
                          <p className="font-semibold text-slate-200">{attempt.quiz.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{new Date(attempt.submitted_at).toLocaleDateString()} · {attempt.correct_answers}/{attempt.total_questions} correct</p>
                        </div>
                        <strong className={attempt.status === "PASSED" ? "text-emerald-300" : "text-red-300"}>{attempt.percentage}%</strong>
                      </Link>
                    ))
                  }
                </div> 
                ) : (
                  <p className="mt-8 text-sm text-slate-500">No completed quizzes yet.</p>
                )
            }
            <Link href="/student/quizzes" className="mt-6 inline-flex items-center text-sm font-semibold text-violet-300 hover:text-violet-200">
              Browse quizzes <ChevronRight size={16} />
            </Link>
          </article>
        </section>
      </div>
    </main>         
  )
  
}
