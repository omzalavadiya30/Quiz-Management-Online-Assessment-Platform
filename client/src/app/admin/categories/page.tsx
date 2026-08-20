"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Pencil, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/layout/AdminLayout";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Category = {
  id: string;
  name: string;
  description?: string;
  quizzes?: { id: string; title: string; status: string }[];
};

const emptyForm = { name: "", description: "" };
type CategoryErrors = { name?: string; description?: string };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<CategoryErrors>({});

  const loadCategories = async () => {
    const response = await fetch(`${API_URL}/categories`, { credentials: "include" });
    if (!response.ok) throw new Error("Unable to load categories");
    const data = await response.json();
    setCategories(data.categories || []);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const authResponse = await fetch(`${API_URL}/auth/me`, { credentials: "include" });
        const me = await authResponse.json().catch(() => ({}));
        if (!authResponse.ok) return router.push("/auth/login");
        if (me?.user?.role !== "ADMIN") return router.push("/dashboard");
        await loadCategories();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load categories");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const validateForm = () => {
    const nextErrors: CategoryErrors = {};
    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) nextErrors.name = "Category name is required.";
    else if (name.length < 2) nextErrors.name = "Category name must be at least 2 characters.";
    else if (name.length > 80) nextErrors.name = "Category name must be 80 characters or fewer.";

    if (description.length > 300) nextErrors.description = "Description must be 300 characters or fewer.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/categories${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save category");
      toast.success(editingId ? "Category updated successfully" : "Category created successfully");
      await loadCategories();
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this category? Quizzes will remain but become uncategorized.")) return;
    try {
      const response = await fetch(`${API_URL}/categories/${id}`, { method: "DELETE", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to delete category");
      setCategories((current) => current.filter((category) => category.id !== id));
      toast.success("Category deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete category");
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    router.push("/auth/login");
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-violet-300">Content structure</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Categories</h1>
            <p className="mt-2 text-slate-400">Organize quizzes into clear learning paths.</p>
          </div>
          <button onClick={() => { setForm(emptyForm); setEditingId(null); setErrors({}); setShowForm(true); }} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 hover:brightness-110">
            <Plus size={18} /> New category
          </button>
        </header>

        {loading ? <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-12 text-center text-violet-300">Loading categories...</div> : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {categories.length === 0 ? <div className="col-span-full rounded-3xl border border-dashed border-white/15 bg-slate-900/40 p-12 text-center text-slate-400">No categories created yet.</div> : categories.map((category) => (
              <article key={category.id} className="group rounded-3xl border border-white/10 bg-slate-900/60 p-5 shadow-xl shadow-slate-950/20 transition hover:-translate-y-1 hover:border-violet-400/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300"><FolderKanban size={20} /></div>
                    <div><h2 className="font-bold text-white">{category.name}</h2><p className="text-xs text-slate-500">{category.quizzes?.length || 0} quizzes</p></div>
                  </div>
                  <div className="flex gap-1 opacity-70 transition group-hover:opacity-100">
                    <button title="Edit category" onClick={() => { setEditingId(category.id); setForm({ name: category.name, description: category.description || "" }); setShowForm(true); }} className="rounded-lg p-2 text-sky-300 hover:bg-sky-400/10"><Pencil size={16} /></button>
                    <button title="Delete category" onClick={() => handleDelete(category.id)} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="mt-5 min-h-10 text-sm leading-6 text-slate-400">{category.description || "No description added."}</p>
                {category.quizzes && category.quizzes.length > 0 && <div className="mt-5 border-t border-white/10 pt-4"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Quizzes</p><div className="space-y-2">{category.quizzes.slice(0, 3).map((quiz) => <div key={quiz.id} className="flex items-center justify-between text-sm text-slate-300"><span className="truncate">{quiz.title}</span><span className="ml-2 text-xs text-slate-500">{quiz.status}</span></div>)}</div></div>}
              </article>
            ))}
          </section>
        )}
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"><form onSubmit={handleSubmit} className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#071a2e] p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.25em] text-violet-300">Category management</p><h2 className="mt-1 text-2xl font-bold text-white">{editingId ? "Edit category" : "New category"}</h2></div><button type="button" onClick={resetForm} className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X size={20} /></button></div><div className="space-y-4"><div><label htmlFor="category-name" className="mb-2 block text-sm font-medium text-slate-300">Name</label><input id="category-name" value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setErrors({ ...errors, name: "" }); }} maxLength={80} aria-invalid={Boolean(errors.name)} className={`h-12 w-full rounded-xl border bg-slate-950/60 px-4 text-white outline-none focus:border-violet-400 ${errors.name ? "border-red-400" : "border-white/10"}`} placeholder="JavaScript" />{errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}</div><div><label htmlFor="category-description" className="mb-2 block text-sm font-medium text-slate-300">Description</label><textarea id="category-description" value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); setErrors({ ...errors, description: "" }); }} maxLength={300} rows={4} aria-invalid={Boolean(errors.description)} className={`w-full resize-y rounded-xl border bg-slate-950/60 px-4 py-3 text-white outline-none focus:border-violet-400 ${errors.description ? "border-red-400" : "border-white/10"}`} placeholder="What this category covers" />{errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}<p className="mt-1 text-right text-xs text-slate-500">{form.description.length}/300</p></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={resetForm} className="rounded-xl border border-white/10 px-4 py-3 text-sm text-slate-300 hover:bg-white/5">Cancel</button><button disabled={saving} className="rounded-xl bg-linear-to-r from-blue-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Saving..." : editingId ? "Save changes" : "Create category"}</button></div></form></div>}
    </AdminLayout>
  );
}
