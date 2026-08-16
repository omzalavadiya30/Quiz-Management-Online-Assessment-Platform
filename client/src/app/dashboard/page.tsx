"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DashboardPage() {
  const router = useRouter();

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
      <div className="mx-auto max-w-6xl">
        <nav className="mb-10 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/40">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300">Quiz platform</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10">Home</Link>
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
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Total Students</p>
            <h2 className="mt-3 text-3xl font-bold text-white">1,248</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Active Quizzes</p>
            <h2 className="mt-3 text-3xl font-bold text-white">48</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Average Score</p>
            <h2 className="mt-3 text-3xl font-bold text-white">86%</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-lg shadow-slate-950/30">
            <p className="text-sm text-slate-400">Pending Reviews</p>
            <h2 className="mt-3 text-3xl font-bold text-white">12</h2>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Quick actions</h3>
            <div className="mt-5 space-y-3">
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">Create new quiz</button>
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">Manage categories</button>
              <button className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-slate-200 hover:bg-white/10">View student results</button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <h3 className="text-xl font-semibold text-white">Recent activity</h3>
            <ul className="mt-5 space-y-4 text-sm text-slate-300">
              <li className="border-b border-white/10 pb-3">New quiz created: JavaScript Fundamentals</li>
              <li className="border-b border-white/10 pb-3">Student @maria completed the Assessment Test</li>
              <li className="border-b border-white/10 pb-3">Category updated: Web Development</li>
              <li>Reset password email sent to 3 users</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
