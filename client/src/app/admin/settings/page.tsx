"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { ShieldCheck, UserRoundPlus, CheckCircle2, Wrench } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    quizApproval: true,
    studentApproval: false,
    autoResults: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    const verifyAccess = async () => {
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
      } catch (error) {
        toast.error("Unable to verify access");
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
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

  const handleSettingChange = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Setting updated");
  };

  const settingCards = [
    {
      key: "quizApproval" as const,
      title: "Quiz Approval Required",
      description: "Require admin review before quizzes are published and made available to students.",
      checked: settings.quizApproval,
      icon: ShieldCheck,
      iconColor: "bg-violet-500/15 text-violet-300",
    },
    {
      key: "studentApproval" as const,
      title: "Student Registration Approval",
      description: "Review and approve student sign-ups before they can access quizzes and courses.",
      checked: settings.studentApproval,
      icon: UserRoundPlus,
      iconColor: "bg-sky-500/15 text-sky-300",
    },
    {
      key: "autoResults" as const,
      title: "Auto Publish Results",
      description: "Automatically grade attempts and publish result summaries as soon as a quiz ends.",
      checked: settings.autoResults,
      icon: CheckCircle2,
      iconColor: "bg-emerald-500/15 text-emerald-300",
    },
    {
      key: "maintenanceMode" as const,
      title: "Maintenance Mode",
      description: "Temporarily disable student access while you perform updates, migrations, or system maintenance.",
      checked: settings.maintenanceMode,
      icon: Wrench,
      iconColor: "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300/90">Administration</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Settings</h1>
          <p className="max-w-2xl text-sm text-slate-400 md:text-base">Configure system-wide settings and preferences.</p>
        </header>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="text-sm font-medium uppercase tracking-[0.28em] text-violet-300">Loading settings...</div>
          </div>
        ) : (
          <div className="space-y-5">
            {settingCards.map(({ key, title, description, checked, icon: Icon, iconColor }) => (
              <div
                key={key}
                className="rounded-[26px] border border-white/10 bg-[#081b2e]/80 px-5 py-4 shadow-[0_8px_25px_rgba(2,6,23,0.28)] transition-colors duration-200 hover:border-white/15 md:px-6 md:py-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 ${iconColor}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white md:text-[2rem]">{title}</h3>
                      <p className="mt-1 max-w-xl text-sm text-slate-400 md:text-base">{description}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Toggle ${title}`}
                    aria-pressed={checked}
                    onClick={() => handleSettingChange(key)}
                    className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-white/10 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-400/70 focus:ring-offset-2 focus:ring-offset-[#081b2e] ${
                      checked ? "bg-violet-500 shadow-[0_0_18px_rgba(168,85,247,0.45)]" : "bg-slate-600"
                    }`}
                  >
                    <span
                      className="absolute left-1 h-6 w-6 rounded-full bg-white shadow-[0_2px_10px_rgba(15,23,42,0.35)] transition-transform duration-200"
                      style={{ transform: checked ? "translateX(24px)" : "translateX(0px)" }}
                    />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2">
              <h3 className="text-[2rem] font-black tracking-tight text-white">System Information</h3>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-400">System Version</p>
                  <p className="mt-3 text-2xl font-bold text-white">1.0.0</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-400">API Version</p>
                  <p className="mt-3 text-2xl font-bold text-white">v1.0</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-400">Database</p>
                  <p className="mt-3 text-xl font-bold text-white">Supabase</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm text-slate-400">Environment</p>
                  <p className="mt-3 text-xl font-bold text-white">Production</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
