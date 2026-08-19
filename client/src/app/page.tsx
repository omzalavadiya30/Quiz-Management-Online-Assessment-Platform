"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        setIsLoggedIn(res.ok);
      } catch {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

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

      setIsLoggedIn(false);
      toast.success(data.message || "Logged out successfully.");
      router.push("/auth/login");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out. Please try again.";
      toast.error(message);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#020817_0%,#0f172a_35%,#111827_100%)] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-16 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 font-bold text-white">Q</div>
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-blue-200 uppercase">Quiz</p>
              <p className="text-xs text-slate-300">Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button onClick={handleLogout} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">Logout</button>
              </>
            ) : (
              <Link href="/auth/login" className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400">Sign in</Link>
            )}
          </div>
        </nav>

        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="inline-flex rounded-full border border-blue-400/40 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-[0.2em] text-blue-200 uppercase">Student & admin access</span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white md:text-6xl">Build smarter assessments with secure access.</h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Create quizzes, manage students, and enable secure login flows for both admins and learners in a clean, modern platform.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="mt-1 text-sm text-slate-300">Assessment attempts</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="mt-1 text-sm text-slate-300">Secure access</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="mt-1 text-sm text-slate-300">Monitoring</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-blue-900/30 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Secure access</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Authentication</h2>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">Live</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student</p>
                <p className="mt-2 text-sm text-slate-200">Register, log in securely, and resume quiz sessions without friction.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Admin</p>
                <p className="mt-2 text-sm text-slate-200">Manage categories, quizzes, drafts, and learner analytics with a controlled admin role.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Security</p>
                <p className="mt-2 text-sm text-slate-200">Password encryption, JWT-based session handling, and reset-by-email flow for recovery.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
