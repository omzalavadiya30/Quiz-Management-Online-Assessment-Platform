"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, BarChart3, Settings, LogOut, Sparkles, FileText } from "lucide-react";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/quizzes", label: "Quizzes", icon: FileText },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#020b1a] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[280px] flex-col justify-between border-r border-white/10 bg-[#071325]/80 px-5 py-7 shadow-[0_0_0_1px_rgba(148,163,184,0.08)] backdrop-blur-xl lg:flex">
          <div>
            <div className="mb-8 px-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-violet-300/90">
                Admin Portal
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-white">Quiz Management</h1>
              </div>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 ring-1 ring-violet-300/40"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                        isActive ? "bg-white/12" : "bg-slate-800/70 group-hover:bg-white/10"
                      }`}
                    >
                      <Icon size={17} />
                    </div>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </aside>

        <div className="flex-1">
          <header className="border-b border-white/10 bg-[#061224]/80 px-4 py-4 backdrop-blur-sm lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-300/90">
                  Admin Portal
                </p>
                <h1 className="mt-1 text-xl font-bold text-white">Quiz Management</h1>
              </div>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
