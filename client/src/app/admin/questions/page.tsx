"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/layout/AdminLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Quiz = { id: string; title: string };
type Option = { id?: string; text: string; is_correct: boolean; option_text?: string };
type Question = { id: string; quiz_id: string; question_text: string; explanation?: string; marks: number; difficulty: "EASY" | "MEDIUM" | "HARD"; question_options?: Option[] };

type FormState = { quiz_id: string; question_text: string; explanation: string; marks: number; difficulty: "EASY" | "MEDIUM" | "HARD"; options: Option[] };
type QuestionErrors = { quiz_id?: string; question_text?: string; explanation?: string; marks?: string; difficulty?: string; options?: string; optionFields?: string[] };

const createForm = (quizId = ""): FormState => ({ quiz_id: quizId, question_text: "", explanation: "", marks: 1, difficulty: "MEDIUM", options: [0, 1, 2, 3].map(() => ({ text: "", is_correct: false })) });

export default function AdminQuestionsPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [form, setForm] = useState<FormState>(createForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<QuestionErrors>({});

  const loadQuestions = async (quizId = selectedQuiz) => {
    if (!quizId) return setQuestions([]);
    const response = await fetch(`${API_URL}/questions?quiz_id=${encodeURIComponent(quizId)}`, { credentials: "include" });
    if (!response.ok) throw new Error("Unable to load questions");
    const data = await response.json();
    setQuestions(data.questions || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const authResponse = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        const me = await authResponse.json().catch(() => ({}));
        if (!authResponse.ok) return router.push("/auth/login");
        if (me?.user?.role !== "ADMIN") return router.push("/dashboard");
        const quizResponse = await fetch(`${API_URL}/quizzes`, { credentials: "include" });
        const quizData = await quizResponse.json();
        const quizList = quizData.quizzes || [];
        setQuizzes(quizList);
        if (quizList[0]) setSelectedQuiz(quizList[0].id);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load question manager");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  useEffect(() => {
    if (selectedQuiz) loadQuestions(selectedQuiz).catch((error) => toast.error(error.message));
  }, [selectedQuiz]);

  const resetForm = () => { setForm(createForm(selectedQuiz)); setEditingId(null); setShowForm(false); setErrors({}); };
  const updateOption = (index: number, value: string) => { setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => optionIndex === index ? { ...option, text: value } : option) })); setErrors((current) => ({ ...current, options: "", optionFields: current.optionFields?.map((error, errorIndex) => errorIndex === index ? "" : error) })); };
  const chooseCorrect = (index: number) => { setForm((current) => ({ ...current, options: current.options.map((option, optionIndex) => ({ ...option, is_correct: optionIndex === index })) })); setErrors((current) => ({ ...current, options: "" })); };

  const validateForm = () => {
    const nextErrors: QuestionErrors = {};
    const optionFields = form.options.map((option) => option.text.trim() ? "" : "This option is required.");
    const normalizedOptions = form.options.map((option) => option.text.trim().toLowerCase());

    if (!form.quiz_id) nextErrors.quiz_id = "Please select a quiz.";
    if (!form.question_text.trim()) nextErrors.question_text = "Question text is required.";
    else if (form.question_text.trim().length < 10) nextErrors.question_text = "Question must be at least 10 characters.";
    else if (form.question_text.trim().length > 500) nextErrors.question_text = "Question must be 500 characters or fewer.";
    if (optionFields.some(Boolean)) nextErrors.optionFields = optionFields;
    if (new Set(normalizedOptions.filter(Boolean)).size !== normalizedOptions.filter(Boolean).length) nextErrors.options = "Options must be different from each other.";
    if (form.options.filter((option) => option.is_correct).length !== 1) nextErrors.options = "Select exactly one correct answer.";
    if (!Number.isFinite(form.marks) || form.marks <= 0 || form.marks > 100) nextErrors.marks = "Marks must be greater than 0 and no more than 100.";
    if (form.explanation.trim().length > 1000) nextErrors.explanation = "Explanation must be 1,000 characters or fewer.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/questions${editingId ? `/${editingId}` : ""}`, { method: editingId ? "PUT" : "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save question");
      toast.success(editingId ? "Question updated successfully" : "Question created successfully");
      await loadQuestions(form.quiz_id);
      resetForm();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save question"); } finally { setSaving(false); }
  };

  const handleEdit = (question: Question) => {
    const options = [...(question.question_options || [])].slice(0, 4).map((option) => ({ text: option.option_text || option.text, is_correct: option.is_correct }));
    while (options.length < 4) options.push({ text: "", is_correct: false });
    setForm({ quiz_id: question.quiz_id, question_text: question.question_text, explanation: question.explanation || "", marks: question.marks, difficulty: question.difficulty, options });
    setErrors({});
    setEditingId(question.id); setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      const response = await fetch(`${API_URL}/questions/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete question");
      setQuestions((current) => current.filter((question) => question.id !== id)); toast.success("Question deleted successfully");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete question"); }
  };

  const handleLogout = async () => { await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }); router.push("/auth/login"); };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Assessment content</p><h1 className="mt-2 text-4xl font-black tracking-tight text-white">Questions</h1><p className="mt-2 text-slate-400">Create multiple-choice questions with four options and one correct answer.</p></div><button onClick={() => { setForm(createForm(selectedQuiz)); setEditingId(null); setErrors({}); setShowForm(true); }} disabled={!selectedQuiz} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={18} /> Add question</button></header>
        <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20"><label htmlFor="question-quiz" className="mb-2 block text-sm font-semibold text-slate-300">Choose quiz</label><select id="question-quiz" value={selectedQuiz} onChange={(event) => setSelectedQuiz(event.target.value)} className="h-12 w-full max-w-xl rounded-xl border border-white/10 bg-slate-950/70 px-4 text-white outline-none focus:border-violet-400"><option value="">Select a quiz</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select></section>
        {loading ? <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center text-violet-300">Loading questions...</div> : !selectedQuiz ? <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center text-slate-400">Create a quiz first, then add questions here.</div> : <section className="min-w-0 space-y-4">{questions.length === 0 ? <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/40 p-12 text-center text-slate-400">No questions for this quiz yet.</div> : questions.map((question, index) => <article key={question.id} className="min-w-0 rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-lg shadow-slate-950/20"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-bold text-violet-300">{index + 1}</span><div className="min-w-0"><h2 className="wrap-break-word text-lg font-bold text-white">{question.question_text}</h2><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-blue-300">{question.difficulty}</span><span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-300">{question.marks} mark{question.marks === 1 ? "" : "s"}</span></div></div></div><div className="flex shrink-0 gap-1"><button title="Edit question" onClick={() => handleEdit(question)} className="rounded-lg p-2 text-sky-300 hover:bg-sky-400/10"><Pencil size={17} /></button><button title="Delete question" onClick={() => handleDelete(question.id)} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"><Trash2 size={17} /></button></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{(question.question_options || []).map((option) => <div key={option.id || option.text} className={`wrap-break-word rounded-xl border px-3 py-2.5 text-sm ${option.is_correct ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-slate-950/40 text-slate-300"}`}>{option.option_text || option.text}{option.is_correct && <span className="ml-2 text-xs font-semibold uppercase tracking-wider">Correct</span>}</div>)}</div>{question.explanation && <p className="mt-4 wrap-break-word border-t border-white/10 pt-4 text-sm leading-6 text-slate-400"><span className="font-semibold text-slate-300">Explanation:</span> {question.explanation}</p>}</article>)}</section>}
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={handleSubmit} className="my-4 w-full max-w-3xl rounded-3xl border border-white/10 bg-[#071a2e] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-6 py-5"><div><p className="text-xs uppercase tracking-[0.25em] text-violet-300">Multiple choice question</p><h2 className="mt-1 text-2xl font-bold text-white">{editingId ? "Edit question" : "Add question"}</h2></div><button type="button" onClick={resetForm} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button></div><div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-6"><div><label className="mb-2 block text-sm font-medium text-slate-300">Quiz</label><select value={form.quiz_id} onChange={(event) => { setForm({ ...form, quiz_id: event.target.value }); setErrors({ ...errors, quiz_id: "" }); }} aria-invalid={Boolean(errors.quiz_id)} className={`h-12 w-full rounded-xl border bg-slate-950/60 px-4 text-white outline-none focus:border-violet-400 ${errors.quiz_id ? "border-red-400" : "border-white/10"}`}><option value="">Select a quiz</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</select>{errors.quiz_id && <p className="mt-1 text-sm text-red-400">{errors.quiz_id}</p>}</div><div><label htmlFor="question-text" className="mb-2 block text-sm font-medium text-slate-300">Question text</label><textarea id="question-text" value={form.question_text} onChange={(event) => { setForm({ ...form, question_text: event.target.value }); setErrors({ ...errors, question_text: "" }); }} maxLength={500} rows={3} aria-invalid={Boolean(errors.question_text)} className={`w-full resize-y rounded-xl border bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-violet-400 ${errors.question_text ? "border-red-400" : "border-white/10"}`} placeholder="Which method converts a JSON string into a JavaScript object?" />{errors.question_text && <p className="mt-1 text-sm text-red-400">{errors.question_text}</p>}<p className="mt-1 text-right text-xs text-slate-500">{form.question_text.length}/500</p></div><div><div className="mb-3 flex items-center justify-between"><label className="text-sm font-medium text-slate-300">Options</label><span className="text-xs text-slate-500">Choose one correct answer</span></div><div className="grid gap-3 sm:grid-cols-2">{form.options.map((option, index) => <div key={index}><div className={`flex items-center gap-3 rounded-xl border p-3 ${option.is_correct ? "border-emerald-400/40 bg-emerald-400/10" : errors.optionFields?.[index] ? "border-red-400" : "border-white/10 bg-slate-950/50"}`}><input type="radio" name="correct-answer" checked={option.is_correct} onChange={() => chooseCorrect(index)} className="h-4 w-4 accent-emerald-400" aria-label={`Mark option ${index + 1} correct`} /><input value={option.text} onChange={(event) => updateOption(index, event.target.value)} maxLength={200} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600" placeholder={`Option ${String.fromCharCode(65 + index)}`} /></div>{errors.optionFields?.[index] && <p className="mt-1 text-xs text-red-400">{errors.optionFields[index]}</p>}</div>)}</div>{errors.options && <p className="mt-2 text-sm text-red-400">{errors.options}</p>}</div><div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-slate-300">Marks</label><input type="number" min={0.5} max={100} step={0.5} value={form.marks} onChange={(event) => { setForm({ ...form, marks: Number(event.target.value) }); setErrors({ ...errors, marks: "" }); }} aria-invalid={Boolean(errors.marks)} className={`h-12 w-full rounded-xl border bg-slate-950/60 px-4 text-white outline-none focus:border-violet-400 ${errors.marks ? "border-red-400" : "border-white/10"}`} />{errors.marks && <p className="mt-1 text-sm text-red-400">{errors.marks}</p>}</div><div><label className="mb-2 block text-sm font-medium text-slate-300">Difficulty</label><select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as FormState["difficulty"] })} className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 text-white outline-none focus:border-violet-400"><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></div></div><div><label htmlFor="question-explanation" className="mb-2 block text-sm font-medium text-slate-300">Explanation</label><textarea id="question-explanation" value={form.explanation} onChange={(event) => { setForm({ ...form, explanation: event.target.value }); setErrors({ ...errors, explanation: "" }); }} maxLength={1000} rows={3} aria-invalid={Boolean(errors.explanation)} className={`w-full resize-y rounded-xl border bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-violet-400 ${errors.explanation ? "border-red-400" : "border-white/10"}`} placeholder="Explain why the correct answer is right." />{errors.explanation && <p className="mt-1 text-sm text-red-400">{errors.explanation}</p>}<p className="mt-1 text-right text-xs text-slate-500">{form.explanation.length}/1000</p></div></div><div className="flex justify-end gap-3 border-t border-white/10 px-6 py-5"><button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">Cancel</button><button disabled={saving} className="rounded-xl bg-linear-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Save changes" : "Add question"}</button></div></form></div>}
    </AdminLayout>
  );
}
