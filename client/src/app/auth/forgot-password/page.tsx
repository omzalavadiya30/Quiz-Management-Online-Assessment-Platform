"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Unable to send reset link");
      }

      toast.success(data.message || "Reset link sent successfully.");
      setEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to send reset link";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-slate-900/75 p-8 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">Account recovery</p>
        <h1 className="mt-4 text-3xl font-bold text-white">Forgot password</h1>
        <p className="mt-3 text-sm text-slate-300">
          Enter your email and we&apos;ll send a password reset link to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-200">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              aria-invalid={Boolean(error)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              placeholder="you@example.com"
            />
            {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          Remember your password? <Link href="/auth/login" className="font-medium text-violet-300 hover:text-violet-200">Back to login</Link>
        </div>
      </div>
    </main>
  );
}
