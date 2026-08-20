"use client";

import { Check, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
type Option = { id: string; option_text: string };
type Question = { id: string; question_text: string; marks: number; difficulty: string; options: Option[] };
type Attempt = { id: string; quiz: { title: string }; expires_at: string; questions: Question[]; answers: Record<string, string> };

export default function StudentAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/student/quizzes/attempts/${params.attemptId}`, { credentials: "include" }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load attempt"); setAttempt(data.attempt); setAnswers(data.attempt.answers || {}); }).catch((error) => toast.error(error.message)).finally(() => setLoading(false));
  }, [params.attemptId]);

  useEffect(() => {
    if (!attempt) return;
    const expiryTime = Date.parse(attempt.expires_at);
    if (!Number.isFinite(expiryTime)) {
      toast.error("This quiz returned an invalid timer. Please start it again.");
      router.push("/student/quizzes");
      return;
    }
    setTimerReady(true);
    const update = () => setRemaining(Math.max(0, Math.floor((expiryTime - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, router]);

  useEffect(() => {
    if (timerReady && remaining === 0 && attempt && !loading && !submitted) {
      submitQuiz("TIME_EXPIRED");
    }
  }, [remaining, timerReady, attempt, loading, submitted]);

  const question = attempt?.questions[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const timeLabel = timerReady ? `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}` : "--:--";

  const selectAnswer = async (optionId: string) => {
    if (!attempt || !question || saving || !timerReady || remaining === 0) return;
    setAnswers((current) => ({ ...current, [question.id]: optionId }));
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/student/quizzes/attempts/${attempt.id}/answers`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question_id: question.id, option_id: optionId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save answer");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save answer"); } finally { setSaving(false); }
  };

  const submitQuiz = async (reason: "MANUAL" | "TIME_EXPIRED" = "MANUAL") => {
    if (!attempt || submitting || submitted) return;
    if (reason === "MANUAL" && !window.confirm("Submit this quiz now? You cannot change answers after submission.")) return;

    try {
      setSubmitting(true);
      const response = await fetch(`${API_URL}/student/quizzes/attempts/${attempt.id}/submit`, { method: "POST", credentials: "include" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to submit quiz");
      setSubmitted(true);
      router.push(`/student/result/${attempt.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit quiz");
      setSubmitting(false);
    }
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-violet-300">Loading attempt...</main>;
  if (!attempt || !question) return <main className="flex min-h-screen items-center justify-center bg-[#020b1a] text-slate-400">Attempt not found.</main>;

  return (
    <main className="min-h-screen bg-[#020b1a] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-violet-300">Active assessment</p>
            <h1 className="mt-1 text-2xl font-black">{attempt.quiz.title}</h1>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 font-mono text-lg font-bold ${remaining < 60 ? "bg-red-500/20 text-red-300" : "bg-violet-500/15 text-violet-200"}`}>
            <Clock3 size={19} /> {timeLabel}
          </div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-slate-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold">Questions</span>
              <span className="text-xs text-slate-500">{answeredCount}/{attempt.questions.length}</span>
            </div>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-3">
              {
                attempt.questions.map((item, index) => (
                  <button key={item.id} onClick={() => setCurrentIndex(index)} className={`relative flex h-10 items-center justify-center rounded-xl text-sm font-semibold transition ${index === currentIndex ? "bg-violet-500 text-white" : answers[item.id] ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-950/60 text-slate-400 hover:text-white"}`}>
                    {index + 1}{answers[item.id] && <Check className="absolute -right-1 -top-1 rounded-full bg-emerald-400 p-0.5 text-slate-950" size={13} />}
                  </button>
                )) 
              }
            </div>
          </aside>
        
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Question {currentIndex + 1} of {attempt.questions.length}</span>
              <span>{question.marks} mark{question.marks === 1 ? "" : "s"}</span>
            </div>
            <h2 className="mt-8 text-2xl font-bold leading-9 text-white">{question.question_text}</h2>
            <div className="mt-8 space-y-3">
              {
                question.options.map((option, index) => (
                  <button key={option.id} onClick={() => selectAnswer(option.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${answers[question.id] === option.id ? "border-violet-400 bg-violet-500/15 text-white" : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-violet-400/40 hover:bg-white/5"}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option.option_text}</span>
                  </button>
                ))
              }
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
              <button onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-30">
                <ChevronLeft size={17} /> Previous
              </button>
              <div className="flex gap-3">
                <button onClick={() => submitQuiz()} disabled={submitting || submitted || !timerReady} className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit quiz"}
                </button>
                <button onClick={() => setCurrentIndex((index) => Math.min(attempt.questions.length - 1, index + 1))} disabled={currentIndex === attempt.questions.length - 1} className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-30">
                  Next <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  ) 
}
