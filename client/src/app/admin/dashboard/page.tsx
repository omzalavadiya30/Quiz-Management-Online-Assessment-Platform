"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    totalPassed: 0,
    totalFailed: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
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

        const adminRes = await fetch(`${API_URL}/admin/dashboard`, { credentials: "include" });
        if (!adminRes.ok) {
          throw new Error("Unable to load admin dashboard");
        }

        const adminData = await adminRes.json();
        setStats(adminData?.stats || stats);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
        router.push("/auth/login");
      }
    };

    loadDashboard();
  }, [router]);

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
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/40">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300">Admin portal</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-400"
            >
              Logout
            </button>
          </div>
        </nav>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Students</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{stats.totalStudents}</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Total Quizzes</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{stats.totalQuizzes}</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Questions</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{stats.totalQuestions}</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Quiz Attempts</p>
            <h2 className="mt-3 text-3xl font-bold text-white">{stats.totalAttempts}</h2>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Result Summary</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Passed</span>
                <strong className="text-emerald-300">{stats.totalPassed}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span>Failed</span>
                <strong className="text-red-300">{stats.totalFailed}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Average score</span>
                <strong className="text-violet-300">--</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Admin Controls</h3>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">Manage students</button>
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">Manage quizzes</button>
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">View analytics</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
