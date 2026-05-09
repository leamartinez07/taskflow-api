"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  IconFolder, IconCheck, IconMsg, IconUser,
  IconDatabase, IconRefresh, IconArrow
} from "@/components/icons";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type User    = { id: string; name: string; email: string; created_at: string };
type Project = { id: string; name: string; description: string; status: string; owner_id: string; created_at: string };
type Task    = { id: string; title: string; status: string; priority: string; due_date: string | null; project_id: string; created_at: string };
type Comment = { id: string; content: string; task_id: string; user_id: string; created_at: string };

type Tab = "users" | "projects" | "tasks" | "comments";

const STATUS_COLORS: Record<string, string> = {
  active:      "bg-[#9d5bf4]/15 text-[#c084fc] border-[#9d5bf4]/30",
  archived:    "bg-white/8 text-white/40 border-white/15",
  completed:   "bg-[#9d5bf4]/20 text-[#c084fc] border-[#9d5bf4]/40",
  todo:        "bg-white/8 text-white/40 border-white/15",
  in_progress: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  done:        "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  cancelled:   "bg-red-500/15 text-red-300 border-red-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    "bg-white/8 text-white/35 border-white/10",
  medium: "bg-[#9d5bf4]/15 text-[#c084fc] border-[#9d5bf4]/25",
  high:   "bg-amber-500/15 text-amber-300 border-amber-500/25",
  urgent: "bg-red-500/15 text-red-300 border-red-500/25",
};

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colorClass}`}>
      {label}
    </span>
  );
}

function fmt(date: string) {
  return new Date(date).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
}

type TabDef = {
  key: Tab;
  label: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  count: number;
};

export default function ExplorerPage() {
  const [tab, setTab]             = useState<Tab>("projects");
  const [users, setUsers]         = useState<User[]>([]);
  const [projects, setProjects]   = useState<Project[]>([]);
  const [tasks, setTasks]         = useState<Task[]>([]);
  const [comments, setComments]   = useState<Comment[]>([]);
  const [loading, setLoading]     = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    setLoading(true);
    const [u, p, t, c] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*").order("created_at", { ascending: false }),
    ]);
    if (u.data) setUsers(u.data);
    if (p.data) setProjects(p.data);
    if (t.data) setTasks(t.data);
    if (c.data) setComments(c.data);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const TABS: TabDef[] = [
    { key: "projects", label: "Projects", Icon: IconFolder, count: projects.length },
    { key: "tasks",    label: "Tasks",    Icon: IconCheck,  count: tasks.length },
    { key: "comments", label: "Comments", Icon: IconMsg,    count: comments.length },
    { key: "users",    label: "Users",    Icon: IconUser,   count: users.length },
  ];

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* NAV */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,8,18,0.9)" }}
        className="sticky top-0 z-50 backdrop-blur-md px-6 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm shadow-lg"
              style={{ background: "var(--accent)", boxShadow: "0 4px 20px rgba(157,91,244,0.35)" }}>T</Link>
            <span className="font-bold">TaskFlow <span style={{ color: "var(--brand)" }}>Explorer</span></span>
            <span className="rounded-full px-2 py-0.5 text-[10px]"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>Live DB</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px]" style={{ color: "var(--muted)" }}>
              {lastRefresh.toLocaleTimeString("es-AR")}
            </span>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all disabled:opacity-40"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
              <IconRefresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading…" : "Refresh"}
            </button>
            <Link href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
              <IconArrow className="w-3 h-3 rotate-180" /> Docs
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* STATS */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Projects", value: projects.length, Icon: IconFolder },
            { label: "Tasks",    value: tasks.length,    Icon: IconCheck },
            { label: "Comments", value: comments.length, Icon: IconMsg },
            { label: "Users",    value: users.length,    Icon: IconUser },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <div className="flex items-start justify-between">
                <div className="text-3xl font-extrabold" style={{ color: "var(--brand)" }}>{s.value}</div>
                <s.Icon className="w-5 h-5 mt-1" style={{ color: "var(--dim)" } as React.CSSProperties} />
              </div>
              <div className="mt-2 text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {TABS.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                style={active
                  ? { background: "var(--accent)", color: "#fff", boxShadow: "0 4px 16px rgba(157,91,244,0.3)" }
                  : { border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
                <t.Icon className="w-3.5 h-3.5" />
                {t.label}
                <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={{ background: active ? "rgba(255,255,255,0.2)" : "var(--panel)", color: active ? "#fff" : "var(--muted)" }}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="flex items-center justify-center py-24" style={{ color: "var(--muted)" }}>
            <div className="text-center">
              <IconDatabase className="w-8 h-8 mx-auto mb-3 animate-pulse" style={{ color: "var(--dim)" } as React.CSSProperties} />
              <p className="text-sm">Loading data from Supabase…</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            {/* PROJECTS */}
            {tab === "projects" && (
              projects.length === 0
                ? <Empty label="No projects yet. Create one via POST /api/projects" />
                : <Table headers={["Name", "Status", "Description", "Owner ID", "Created"]} rows={
                    projects.map(p => [
                      <span key="n" className="font-medium" style={{ color: "var(--text)" }}>{p.name}</span>,
                      <Badge key="s" label={p.status} colorClass={STATUS_COLORS[p.status] ?? "bg-white/8 text-white/40 border-white/10"} />,
                      <span key="d" className="max-w-xs truncate block" style={{ color: "var(--muted)" }}>{p.description || "—"}</span>,
                      <span key="o" className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>{p.owner_id?.slice(0, 8)}…</span>,
                      <span key="c" className="text-xs" style={{ color: "var(--muted)" }}>{fmt(p.created_at)}</span>,
                    ])
                  } />
            )}

            {/* TASKS */}
            {tab === "tasks" && (
              tasks.length === 0
                ? <Empty label="No tasks yet. Create one via POST /api/tasks" />
                : <Table headers={["Title", "Status", "Priority", "Due Date", "Project ID", "Created"]} rows={
                    tasks.map(t => [
                      <span key="ti" className="font-medium max-w-xs truncate block" style={{ color: "var(--text)" }}>{t.title}</span>,
                      <Badge key="s" label={t.status} colorClass={STATUS_COLORS[t.status] ?? "bg-white/8 text-white/40 border-white/10"} />,
                      <Badge key="p" label={t.priority} colorClass={`${PRIORITY_COLORS[t.priority] ?? ""} border`} />,
                      <span key="d" className="text-xs" style={{ color: "var(--muted)" }}>{t.due_date ?? "—"}</span>,
                      <span key="pi" className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>{t.project_id?.slice(0, 8)}…</span>,
                      <span key="c" className="text-xs" style={{ color: "var(--muted)" }}>{fmt(t.created_at)}</span>,
                    ])
                  } />
            )}

            {/* COMMENTS */}
            {tab === "comments" && (
              comments.length === 0
                ? <Empty label="No comments yet. Add one via POST /api/tasks/:id/comments" />
                : <Table headers={["Content", "Task ID", "User ID", "Created"]} rows={
                    comments.map(c => [
                      <span key="co" className="max-w-sm truncate block" style={{ color: "var(--text)" }}>{c.content}</span>,
                      <span key="ti" className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>{c.task_id?.slice(0, 8)}…</span>,
                      <span key="ui" className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>{c.user_id?.slice(0, 8)}…</span>,
                      <span key="cr" className="text-xs" style={{ color: "var(--muted)" }}>{fmt(c.created_at)}</span>,
                    ])
                  } />
            )}

            {/* USERS */}
            {tab === "users" && (
              users.length === 0
                ? <Empty label="No users yet. Register via POST /api/auth/register" />
                : <Table headers={["Name", "Email", "ID", "Registered"]} rows={
                    users.map(u => [
                      <span key="n" className="font-medium" style={{ color: "var(--text)" }}>{u.name}</span>,
                      <span key="e" style={{ color: "var(--muted)" }}>{u.email}</span>,
                      <span key="i" className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>{u.id?.slice(0, 8)}…</span>,
                      <span key="c" className="text-xs" style={{ color: "var(--muted)" }}>{fmt(u.created_at)}</span>,
                    ])
                  } />
            )}
          </div>
        )}

        {/* DB SCHEMA */}
        <section className="mt-10">
          <h2 className="mb-4 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Database Schema</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { table: "users",    Icon: IconUser,    fields: ["id (uuid PK)", "name (text)", "email (text unique)", "password_hash (text)", "avatar_url (text?)", "created_at"] },
              { table: "projects", Icon: IconFolder,  fields: ["id (uuid PK)", "name (text)", "description (text?)", "status (enum)", "owner_id → users", "created_at", "updated_at"] },
              { table: "tasks",    Icon: IconCheck,   fields: ["id (uuid PK)", "title (text)", "status (enum)", "priority (enum)", "due_date (date?)", "project_id → projects", "created_by → users", "assigned_to → users?", "created_at"] },
              { table: "comments", Icon: IconMsg,     fields: ["id (uuid PK)", "content (text)", "task_id → tasks", "user_id → users", "created_at"] },
            ].map(s => (
              <div key={s.table} className="rounded-2xl p-4" style={{ border: "1px solid var(--border)", background: "var(--panel)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <s.Icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" } as React.CSSProperties} />
                  <p className="font-mono text-sm font-bold" style={{ color: "var(--text)" }}>{s.table}</p>
                </div>
                <ul className="space-y-1">
                  {s.fields.map(f => (
                    <li key={f} className="font-mono text-[11px]" style={{ color: "var(--muted)" }}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-10 pb-4 text-center text-xs" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", color: "var(--dim)" }}>
          Built by <Link href="https://github.com/leamartinez07" target="_blank" className="hover:underline" style={{ color: "var(--brand)" }}>Leandro Martinez</Link> · TaskFlow API · 2026
        </footer>
      </div>
    </main>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <table className="w-full text-sm">
      <thead style={{ borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="transition-colors" style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--panel)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
            {row.map((cell, j) => (
              <td key={j} className="px-4 py-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="py-16 text-center">
      <div className="flex justify-center mb-3">
        <IconDatabase className="w-8 h-8" style={{ color: "var(--dim)" } as React.CSSProperties} />
      </div>
      <p className="text-sm" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  );
}
