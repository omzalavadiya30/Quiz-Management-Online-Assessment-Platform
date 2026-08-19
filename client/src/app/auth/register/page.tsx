"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });
  const [errors, setErrors] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = { name: "", email: "", password: "" };
    let isValid = true;

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
      isValid = false;
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
      isValid = false;
    }

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
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
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
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.message || data?.errors?.[0]?.msg || "Registration failed";
        throw new Error(message);
      }

      toast.success("Account created successfully.");
      setForm({ name: "", email: "", password: "", role: "STUDENT" });
      router.push("/auth/login");
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
        <div className="relative hidden overflow-hidden bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.28),transparent_35%),linear-gradient(135deg,#0f172a_0%,#111827_100%)] p-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-200">Welcome</p>
            <h1 className="mt-6 text-4xl font-bold text-white">Create your account</h1>
            <p className="mt-4 max-w-md text-lg text-slate-300">
              Join the quiz platform and choose the role that matches your access level for secure login and dashboard flow.
            </p>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
            <div className="flex items-center justify-between"><span>Secure registration</span><span className="text-emerald-300">Enabled</span></div>
            <div className="flex items-center justify-between"><span>Password encryption</span><span className="text-emerald-300">AES+hash</span></div>
            <div className="flex items-center justify-between"><span>JWT session</span><span className="text-emerald-300">Active</span></div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-blue-300">Quiz platform</p>
              <h2 className="mt-2 text-3xl font-bold text-white">Register</h2>
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
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm text-slate-200">Full name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                placeholder="Enter your full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-200">Email address</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
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
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 pr-12 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-blue-300 hover:text-blue-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account? <Link href="/auth/login" className="font-medium text-blue-300 hover:text-blue-200">Login</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
