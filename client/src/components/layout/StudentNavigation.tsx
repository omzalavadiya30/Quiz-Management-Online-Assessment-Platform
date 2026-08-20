"use client";

import Link from "next/link";
import { BarChart3, History, LayoutDashboard } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }, { href: "/student/quizzes", label: "Quizzes", icon: BarChart3 }, { href: "/student/history", label: "History", icon: History }];
export default function StudentNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Student navigation" className="flex flex-wrap items-center gap-1">
      {
        items.map(({ href, label, icon: Icon }) => { 
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href); 
          return (
            <Link key={href} href={href} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? "bg-violet-500/20 text-violet-200" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={16} />{label}
            </Link> 
          ) 
        })
      }
    </nav>
  )
}
