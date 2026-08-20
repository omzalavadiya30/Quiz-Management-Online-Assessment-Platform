"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import { Users, BarChart3, FileText, TrendingUp } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface AdminStats {
  totalStudents: number;
  totalQuizzes: number;
  totalQuestions: number;
  totalAttempts: number;
  totalPassed: number;
  totalFailed: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    totalQuizzes: 0,
    totalQuestions: 0,
    totalAttempts: 0,
    totalPassed: 0,
    totalFailed: 0,
  });
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
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

  const passRate = stats.totalAttempts > 0 ? Math.round((stats.totalPassed / stats.totalAttempts) * 100) : 0;

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      color: "from-sky-500/15 to-cyan-500/10",
      icon: Users,
      iconColor: "text-sky-300",
      border: "border-sky-500/20",
    },
    {
      label: "Active Quizzes",
      value: stats.totalQuizzes,
      color: "from-violet-500/15 to-fuchsia-500/10",
      icon: BarChart3,
      iconColor: "text-violet-300",
      border: "border-violet-500/20",
    },
    {
      label: "Questions",
      value: stats.totalQuestions,
      color: "from-emerald-500/15 to-green-500/10",
      icon: FileText,
      iconColor: "text-emerald-300",
      border: "border-emerald-500/20",
    },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      color: "from-amber-500/15 to-orange-500/10",
      icon: TrendingUp,
      iconColor: "text-amber-300",
      border: "border-amber-500/20",
    },
  ];

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300/90">Dashboard</p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Overview</h1>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-slate-400 md:text-base">
            Welcome to your admin dashboard. Monitor all quiz activities and manage users with a focused overview.
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-65 items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="text-sm font-medium uppercase tracking-[0.28em] text-violet-300">Loading dashboard...</div>
          </div>
        ) : (
          <>
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map(({ label, value, color, icon: Icon, iconColor, border }) => (
                <article
                  key={label}
                  className={`rounded-3xl border bg-linear-to-br ${color} p-5 shadow-[0_18px_40px_rgba(15,23,42,0.45)] ${border}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-300">{label}</p>
                      <h2 className="mt-5 text-4xl font-black tracking-tight text-white">{value}</h2>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40">
                      <Icon className={`${iconColor}`} size={28} />
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="grid gap-5 lg:grid-cols-3">
              <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                <h3 className="text-2xl font-bold text-white">Quiz Attempts</h3>
                <p className="mt-1 text-sm text-slate-400">Total attempts made</p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Total Attempts</span>
                    <strong className="text-2xl font-bold text-violet-300">{stats.totalAttempts}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Completed</span>
                    <strong className="text-2xl font-bold text-emerald-300">{stats.totalPassed + stats.totalFailed}</strong>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                <h3 className="text-2xl font-bold text-white">Performance</h3>
                <p className="mt-1 text-sm text-slate-400">Student results</p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Passed</span>
                    <strong className="text-2xl font-bold text-emerald-300">{stats.totalPassed}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Failed</span>
                    <strong className="text-2xl font-bold text-red-300">{stats.totalFailed}</strong>
                  </div>
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
                <h3 className="text-2xl font-bold text-white">Quick Stats</h3>
                <p className="mt-1 text-sm text-slate-400">System overview</p>

                <div className="mt-8 space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Avg Per Student</span>
                    <strong className="text-2xl font-bold text-sky-300">
                      {stats.totalStudents > 0 ? Math.round(stats.totalAttempts / stats.totalStudents) : 0}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3">
                    <span className="text-slate-300">Active Rate</span>
                    <strong className="text-2xl font-bold text-amber-300">
                      {stats.totalStudents > 0 ? Math.round((stats.totalAttempts / (stats.totalStudents * 5)) * 100) : 0}%
                    </strong>
                  </div>
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
