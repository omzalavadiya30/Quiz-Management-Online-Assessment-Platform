"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { Trash2, Edit2, Check, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
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

        const usersRes = await fetch(`${API_URL}/users`, { credentials: "include" });
        if (!usersRes.ok) {
          throw new Error("Unable to load users");
        }

        const data = await usersRes.json();
        setUsers(data?.users || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load users");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
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

  const handleUpdateStatus = async (userId: string, newStatus: "ACTIVE" | "INACTIVE") => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Unable to update user status");
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
      toast.success("User status updated successfully.");
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleting(userId);
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Unable to delete user");
      }

      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success("User deleted successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-violet-300/90">Users</p>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">Manage Users</h1>
          <p className="max-w-2xl text-sm text-slate-400 md:text-base">
            View and manage all student and admin accounts in the system.
          </p>
        </header>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60">
            <div className="text-sm font-medium uppercase tracking-[0.28em] text-violet-300">Loading users...</div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/60 shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/40 text-slate-300">
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="border-b border-white/5 transition hover:bg-white/5">
                        <td className="px-5 py-4 font-medium text-white">{user.name}</td>
                        <td className="px-5 py-4 text-slate-300">{user.email}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                              user.role === "ADMIN"
                                ? "bg-violet-500/15 text-violet-300"
                                : "bg-sky-500/15 text-sky-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {editingId === user.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editingStatus}
                                onChange={(e) => setEditingStatus(e.target.value as "ACTIVE" | "INACTIVE")}
                                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm text-white outline-none ring-0 focus:border-violet-400"
                              >
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="INACTIVE">INACTIVE</option>
                              </select>
                              <button
                                onClick={() => handleUpdateStatus(user.id, editingStatus)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-300 hover:bg-red-500/25"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${
                                user.status === "ACTIVE"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-red-500/15 text-red-300"
                              }`}
                            >
                              {user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-300">{formatDate(user.created_at)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(user.id);
                                setEditingStatus(user.status);
                              }}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleting === user.id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 disabled:opacity-60"
                            >
                              {deleting === user.id ? (
                                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-950/40 px-5 py-4 text-sm text-slate-300">
              <span>Total Users: {users.length}</span>
              <span>
                Admins: {users.filter((user) => user.role === "ADMIN").length} | Students: {users.filter((user) => user.role === "STUDENT").length}
              </span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
