"use client";

import Link from "next/link";
import { Search, Clock3, CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Quiz = { id: string; title: string; description?: string; difficulty: string; duration: number; passing_score: number; categories?: { name: string } };

export default function StudentQuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const auth = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        const me = await auth.json().catch(() => ({}));
        if (!auth.ok) return router.push("/auth/login");
        if (me?.user?.role !== "STUDENT") return router.push("/admin/dashboard");
        const response = await fetch(`${API_URL}/student/quizzes`, { credentials: "include" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load quizzes");
        setQuizzes(data.quizzes || []);
      } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load quizzes"); } finally { setLoading(false); }
    };
    load();
  }, [router]);

  const filtered = quizzes.filter((quiz) => {
    const matchesSearch = `${quiz.title} ${quiz.description || ""} ${quiz.categories?.name || ""}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!difficulty || quiz.difficulty === difficulty);
  });

  return <main className="min-h-screen bg-[#020b1a] px-4 py-8 text-white sm:px-6 lg:px-10"><div className="mx-auto max-w-7xl"><header className="mb-8"><p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Student workspace</p><h1 className="mt-2 text-4xl font-black">Discover quizzes</h1><p className="mt-2 text-slate-400">Choose a published quiz and test your knowledge.</p></header><section className="mb-8 flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/60 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-500" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or category" className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/70 pl-10 pr-4 text-white outline-none focus:border-violet-400" /></div><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none focus:border-violet-400"><option value="">All difficulties</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></section>{loading ? <div className="rounded-3xl border border-white/10 p-12 text-center text-violet-300">Loading published quizzes...</div> : <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((quiz) => <article key={quiz.id} className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-violet-400/30"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-300">{quiz.categories?.name || "General"}</span><span className="text-xs text-slate-500">{quiz.difficulty}</span></div><h2 className="mt-5 text-xl font-bold">{quiz.title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{quiz.description || "Test your knowledge with this assessment."}</p><div className="mt-6 flex items-center gap-4 text-sm text-slate-400"><span className="inline-flex items-center gap-1"><Clock3 size={16} /> {quiz.duration} min</span><span className="inline-flex items-center gap-1"><CircleHelp size={16} /> Pass {quiz.passing_score}%</span></div><Link href={`/student/quizzes/${quiz.id}`} className="mt-6 block rounded-xl bg-linear-to-r from-violet-500 to-indigo-500 px-4 py-3 text-center text-sm font-semibold text-white hover:brightness-110">View quiz</Link></article>)}{filtered.length === 0 && <div className="col-span-full rounded-3xl border border-dashed border-white/15 p-12 text-center text-slate-400">No published quizzes match your search.</div>}</section>}</div></main>;
}
