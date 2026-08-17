"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", role: "STUDENT" });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = { email: "", password: "" };
    let isValid = true;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
      isValid = false;
    } else if (!emailOk) {
      nextErrors.email = "Please enter a valid email address.";
      isValid = false;
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
      isValid = false;
    }

    setErrors(nextErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.message || data?.errors?.[0]?.msg || "Login failed";
        throw new Error(message);
      }

      toast.success("Login successful.");
      setForm({ email: "", password: "", role: "STUDENT" });

      const userRole = data?.user?.role || form.role;
      router.push(userRole === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-slate-900/70 shadow-2xl shadow-blue-950/30 backdrop-blur-xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_35%),linear-gradient(135deg,#020817_0%,#111827_100%)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-200">Secure access</p>
            <h1 className="mt-6 text-4xl font-bold text-white">Welcome back</h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Sign in to continue your quiz journey, view results, and access your performance analytics safely.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            <div className="flex items-center justify-between"><span>JWT session</span><span className="text-emerald-300">Protected</span></div>
            <div className="flex items-center justify-between"><span>Reset password</span><span className="text-emerald-300">Email link</span></div>
            <div className="flex items-center justify-between"><span>Role-based access</span><span className="text-emerald-300">Ready</span></div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-300">Quiz platform</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Login</h2>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-1">
            {[
              { value: "STUDENT", label: "Student" },
              { value: "ADMIN", label: "Admin" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: option.value }))}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  form.role === option.value
                    ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-200">Email address</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-200">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-violet-300 hover:text-violet-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link href="/auth/forgot-password" className="font-medium text-violet-300 transition hover:text-violet-200">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account? <Link href="/auth/register" className="font-medium text-violet-300 hover:text-violet-200">Register</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
