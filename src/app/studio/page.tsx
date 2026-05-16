"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  IconFolder, IconCheck, IconMsg, IconUser, IconPlus,
  IconLogout, IconTrash, IconChevron, IconSend, IconArrow, IconEye, IconKey
} from "@/components/icons";

const API = "/api";

// ─── types ────────────────────────────────────────────────────────────────────
type AuthUser = { id: string; name: string; email: string };
type Owner    = { id: string; name: string };
type Project  = { id: string; name: string; description: string; status: string; created_at: string; owner?: Owner };
type Task     = { id: string; title: string; status: string; priority: string; due_date: string | null; project_id: string; creator?: Owner; assignee?: Owner | null };
type Comment  = { id: string; content: string; user?: { name: string }; created_at: string };

// ─── api ──────────────────────────────────────────────────────────────────────
async function api(method: string, path: string, token?: string, body?: object) {
  try {
    const r = await fetch(`${API}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = await r.json();
    if (json && "success" in json) {
      if (json.success === false) return json;
      return json.data ?? json;
    }
    return json;
  } catch { return { error: "Network error" }; }
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  todo: "bg-[#3a3260]", in_progress: "bg-yellow-400", done: "bg-[#9d5bf4]", cancelled: "bg-red-500/60",
  active: "bg-[#9d5bf4]", completed: "bg-green-400", archived: "bg-[#3a3260]",
};
const STATUS_CHIP: Record<string, string> = {
  todo: "bg-[#1c1830] text-[#7a6d94] border-[#252040]",
  in_progress: "bg-yellow-500/10 text-yellow-300 border-yellow-500/20",
  done: "bg-[#9d5bf4]/10 text-[#c084fc] border-[#9d5bf4]/25",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  active: "bg-[#9d5bf4]/10 text-[#c084fc] border-[#9d5bf4]/25",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  archived: "bg-[#1c1830] text-[#7a6d94] border-[#252040]",
};
const PRIORITY_C: Record<string, string> = {
  low: "text-[#7a6d94]", medium: "text-[#c084fc]", high: "text-orange-400", urgent: "text-red-400",
};

function Chip({ v }: { v: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CHIP[v] ?? "bg-[#1c1830] text-[#7a6d94] border-[#252040]"}`}>
      {v.replace("_", " ")}
    </span>
  );
}
function fmt(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

// ─── confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(10,8,18,0.8)" }} onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="p-6">
          {/* icon */}
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <IconTrash className="h-5 w-5" style={{ color: "#f87171" }} />
          </div>
          <p className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>{title}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{message}</p>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={onCancel}
            className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-all hover:opacity-80"
            style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── atoms ────────────────────────────────────────────────────────────────────
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
function Input({ label, error, ...p }: { label: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} error={error}>
      <input {...p} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#9d5bf4]/60"
        style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }} />
    </Field>
  );
}
function Select({ label, children, ...p }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label}>
      <select {...p} className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#9d5bf4]/60"
        style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}>
        {children}
      </select>
    </Field>
  );
}
function Btn({ children, variant = "primary", className = "", ...p }: { variant?: "primary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: { background: "var(--accent)", color: "#fff", border: "1px solid transparent" },
    ghost:   { background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--border)" },
    danger:  { background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" },
  }[variant];
  return (
    <button {...p} style={styles}
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95 disabled:opacity-40 hover:opacity-90 ${className}`}>
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════
function AuthPage({ onLogin }: { onLogin: (t: string, u: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    const body = mode === "login" ? { email, password: pass } : { name, email, password: pass };
    const data = await api("POST", `/auth/${mode}`, undefined, body);
    setLoading(false);
    if (data?.token) {
      onLogin(data.token, data.user);
    } else {
      const details = data?.details?.fieldErrors;
      if (details) {
        const msgs = Object.entries(details).map(([f, v]) => `${f}: ${(v as string[]).join(", ")}`).join(" · ");
        setErr(msgs || data.error);
      } else {
        setErr(data?.error ?? "Error al conectar con la API");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ background: "var(--accent)" }} />
      </div>
      <div className="relative w-full max-w-sm">
        {/* logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl font-black text-lg shadow-2xl"
            style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 0 40px rgba(157,91,244,0.35)" }}>T</div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            TaskFlow <span style={{ color: "var(--brand)" }}>Studio</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>Interactive API playground</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {/* tab switcher */}
          <div className="mb-5 flex rounded-xl p-1" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
            {(["login", "register"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }}
                className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all"
                style={mode === m
                  ? { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 12px rgba(157,91,244,0.3)" }
                  : { background: "transparent", color: "var(--muted)" }}>
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <Input label="Nombre" value={name} onChange={e => setName(e.target.value)} placeholder="Leandro" required />
            )}
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="lea@email.com" required />
            <Input label={mode === "register" ? "Contraseña (may. + número requeridos)" : "Contraseña"}
              type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Ej: Leandro123" required />

            {err && (
              <div className="rounded-xl border px-4 py-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                {err}
              </div>
            )}
            <Btn type="submit" disabled={loading} className="w-full">
              {loading ? "Cargando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              <IconArrow className="h-4 w-4" />
            </Btn>
          </form>
        </div>
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs transition-colors hover:opacity-70" style={{ color: "var(--muted)" }}>← API Docs</Link>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function TaskModal({ task, token, onClose, onDelete }: { task: Task; token: string; onClose: () => void; onDelete: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    api("GET", `/tasks/${task.id}/comments`, token).then(d => {
      setComments(Array.isArray(d) ? d : []);
    });
  }, [task.id, token]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const d = await api("POST", `/tasks/${task.id}/comments`, token, { content: text });
    if (d?.content) { setComments(c => [...c, d]); setText(""); }
    setSending(false);
  };

  return (
    <>
      {confirmDelete && (
        <ConfirmModal
          title="¿Eliminar esta tarea?"
          message={`"${task.title}" se eliminará permanentemente junto con sus comentarios. Esta acción no se puede deshacer.`}
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(10,8,18,0.75)" }} onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {/* header */}
        <div className="flex items-start justify-between gap-3 p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold" style={{ color: "var(--text)" }}>{task.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Chip v={task.status} />
              <span className={`text-xs font-semibold ${PRIORITY_C[task.priority]}`}>{task.priority}</span>
              {task.due_date && <span className="text-xs" style={{ color: "var(--muted)" }}>Vence {task.due_date}</span>}
              {task.creator && (
                <span className="flex items-center gap-1">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                    style={{ background: "var(--dim)", color: "var(--muted)" }}>
                    {task.creator.name[0].toUpperCase()}
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>por {task.creator.name}</span>
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2">
            <button onClick={() => setConfirmDelete(true)} className="rounded-xl p-2 transition-all hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
              <IconTrash className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="rounded-xl px-3 py-2 text-xs transition-all hover:opacity-80"
              style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
              Cerrar
            </button>
          </div>
        </div>

        {/* comments */}
        <div className="max-h-56 space-y-2.5 overflow-y-auto p-5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            <IconMsg className="h-3.5 w-3.5" /> {comments.length} comentarios
          </p>
          {comments.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Sin comentarios aún.</p>}
          {comments.map(c => (
            <div key={c.id} className="rounded-xl px-4 py-3" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
              {c.user?.name && <p className="mb-1 text-[10px] font-semibold" style={{ color: "var(--brand)" }}>{c.user.name}</p>}
              <p className="text-sm" style={{ color: "var(--text)" }}>{c.content}</p>
              <p className="mt-1 text-[10px]" style={{ color: "var(--muted)" }}>{fmt(c.created_at)}</p>
            </div>
          ))}
        </div>

        {/* add comment */}
        <form onSubmit={send} className="flex gap-2 p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribir comentario…"
            className="flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none transition-all focus:border-[#9d5bf4]/60"
            style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }} />
          <button type="submit" disabled={sending || !text.trim()}
            className="rounded-xl p-2.5 transition-all active:scale-95 disabled:opacity-40 hover:opacity-90"
            style={{ background: "var(--accent)" }}>
            <IconSend className="h-4 w-4 text-white" />
          </button>
        </form>
      </div>
    </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECT VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectView({ project, token, onBack }: { project: Project; token: string; onBack: () => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const d = await api("GET", `/projects/${project.id}/tasks`, token);
    setTasks(Array.isArray(d) ? d : []);
  }, [project.id, token]);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    await api("POST", "/tasks", token, {
      title, project_id: project.id, status, priority,
      ...(dueDate ? { due_date: dueDate } : {}),
    });
    setTitle(""); setDueDate(""); setShowForm(false); setCreating(false); load();
  };

  const del = async (id: string) => {
    await api("DELETE", `/tasks/${id}`, token);
    setSelected(null); load();
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      {selected && <TaskModal task={selected} token={token} onClose={() => setSelected(null)} onDelete={() => del(selected.id)} />}

      {/* header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="rounded-xl p-2 transition-all hover:opacity-80"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
          <IconChevron className="h-4 w-4 rotate-90" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold" style={{ color: "var(--text)" }}>{project.name}</h2>
          {project.description && <p className="truncate text-sm" style={{ color: "var(--muted)" }}>{project.description}</p>}
        </div>
        <Chip v={project.status} />
        <Btn onClick={() => setShowForm(s => !s)}>
          <IconPlus className="h-4 w-4" /> Nueva tarea
        </Btn>
      </div>

      {showForm && (
        <form onSubmit={create} className="mb-6 space-y-4 rounded-2xl p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--dim)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Nueva tarea</p>
          <Input label="Título" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la tarea" required />
          <div className="grid grid-cols-3 gap-3">
            <Select label="Estado" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="todo">To do</option>
              <option value="in_progress">En progreso</option>
              <option value="done">Hecho</option>
              <option value="cancelled">Cancelado</option>
            </Select>
            <Select label="Prioridad" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </Select>
            <Input label="Vencimiento" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Btn type="submit" disabled={creating}>{creating ? "Creando…" : "Crear tarea"}</Btn>
            <Btn type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--dim)" }}>
          <IconCheck className="mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Sin tareas — creá la primera arriba</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => (
            <div key={t.id} onClick={() => setSelected(t)}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl px-5 py-4 transition-all hover:opacity-90"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className={`h-2 w-2 flex-shrink-0 rounded-full ${STATUS_DOT[t.status] ?? "bg-[#3a3260]"}`} />
              <p className={`flex-1 min-w-0 truncate text-sm font-medium ${t.status === "done" ? "line-through" : ""}`}
                style={{ color: t.status === "done" ? "var(--muted)" : "var(--text)" }}>{t.title}</p>
              {/* creator badge */}
              {t.creator && (
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold"
                    style={{ background: "var(--dim)", color: "var(--muted)" }}>
                    {t.creator.name[0].toUpperCase()}
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>{t.creator.name}</span>
                </div>
              )}
              <span className={`flex-shrink-0 text-xs font-semibold ${PRIORITY_C[t.priority]}`}>{t.priority}</span>
              {t.due_date && <span className="hidden md:block flex-shrink-0 text-xs" style={{ color: "var(--muted)" }}>{t.due_date}</span>}
              <Chip v={t.status} />
              <IconEye className="h-4 w-4 flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-40" style={{ color: "var(--muted)" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({ token, user, onLogout }: { token: string; user: AuthUser; onLogout: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pStatus, setPStatus] = useState("active");
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"projects" | "profile">("projects");
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);

  const load = useCallback(async () => {
    const d = await api("GET", "/projects", token);
    setProjects(Array.isArray(d) ? d : []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setCreating(true);
    await api("POST", "/projects", token, { name: pName, description: pDesc, status: pStatus });
    setPName(""); setPDesc(""); setShowForm(false); setCreating(false); load();
  };

  const del = async (id: string) => {
    await api("DELETE", `/projects/${id}`, token);
    setConfirmProject(null);
    load();
  };

  if (selected) return <ProjectView project={selected} token={token} onBack={() => { setSelected(null); load(); }} />;

  return (
    <>
    {confirmProject && (
      <ConfirmModal
        title="¿Eliminar este proyecto?"
        message={`"${confirmProject.name}" se eliminará permanentemente junto con todas sus tareas y comentarios. Esta acción no se puede deshacer.`}
        onConfirm={() => del(confirmProject.id)}
        onCancel={() => setConfirmProject(null)}
      />
    )}
    <div className="flex h-full flex-col">
      {/* NAV */}
      <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,8,18,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm shadow-lg"
            style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 0 20px rgba(157,91,244,0.3)" }}>T</div>
          <span className="font-bold" style={{ color: "var(--text)" }}>
            TaskFlow <span style={{ color: "var(--brand)" }}>Studio</span>
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
          {([
            { key: "projects", Icon: IconFolder, label: "Proyectos" },
            { key: "profile", Icon: IconUser, label: "Perfil" },
          ] as const).map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
              style={tab === key
                ? { background: "var(--accent)", color: "#fff" }
                : { background: "transparent", color: "var(--muted)" }}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm sm:block" style={{ color: "var(--muted)" }}>{user.name}</span>
          <Link href="/" className="rounded-xl px-3 py-1.5 text-xs transition-all hover:opacity-80"
            style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            Docs
          </Link>
          <button onClick={onLogout} className="rounded-xl p-2 transition-all hover:opacity-80"
            style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      {tab === "profile" ? (
        <div className="flex flex-1 items-start justify-center px-6 pt-12">
          <div className="w-full max-w-sm space-y-4 rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black shadow-lg"
                style={{ background: "var(--accent)", color: "#fff" }}>
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <p className="font-bold" style={{ color: "var(--text)" }}>{user.name}</p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>{user.email}</p>
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--muted)" }}>JWT Token</p>
              <p className="break-all font-mono text-[10px] leading-relaxed" style={{ color: "var(--dim)" }}>
                {token.slice(0, 100)}…
              </p>
            </div>
            <Btn variant="danger" className="w-full" onClick={onLogout}>
              <IconLogout className="h-4 w-4" /> Cerrar sesión
            </Btn>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-6">
          {/* header */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Proyectos</h2>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{projects.length} total</p>
            </div>
            <Btn onClick={() => setShowForm(s => !s)}>
              <IconPlus className="h-4 w-4" /> Nuevo proyecto
            </Btn>
          </div>

          {showForm && (
            <form onSubmit={create} className="mb-6 space-y-4 rounded-2xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--dim)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Nuevo proyecto</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nombre" value={pName} onChange={e => setPName(e.target.value)} placeholder="Nombre del proyecto" required />
                <Select label="Estado" value={pStatus} onChange={e => setPStatus(e.target.value)}>
                  <option value="active">Activo</option>
                  <option value="completed">Completado</option>
                  <option value="archived">Archivado</option>
                </Select>
              </div>
              <Input label="Descripción (opcional)" value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Descripción breve" />
              <div className="flex gap-2">
                <Btn type="submit" disabled={creating}>{creating ? "Creando…" : "Crear proyecto"}</Btn>
                <Btn type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
              </div>
            </form>
          )}

          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--dim)" }}>
              <IconFolder className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Sin proyectos — creá el primero</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  className="group relative cursor-pointer rounded-2xl p-5 transition-all hover:opacity-90"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="rounded-xl p-2" style={{ background: "rgba(157,91,244,0.12)", border: "1px solid rgba(157,91,244,0.2)" }}>
                      <IconFolder className="h-4 w-4" style={{ color: "var(--brand)" }} />
                    </div>
                    <button onClick={e => { e.stopPropagation(); setConfirmProject(p); }}
                      className="rounded-lg p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:opacity-80"
                      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h3 className="truncate font-semibold" style={{ color: "var(--text)" }}>{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--muted)" }}>{p.description}</p>}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Chip v={p.status} />
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.owner && (
                        <div className="flex items-center gap-1">
                          <div className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold flex-shrink-0"
                            style={{ background: "var(--accent)", color: "#fff" }}>
                            {p.owner.name[0].toUpperCase()}
                          </div>
                          <span className="text-[10px]" style={{ color: "var(--muted)" }}>{p.owner.name}</span>
                        </div>
                      )}
                      <span className="text-[10px]" style={{ color: "var(--dim)" }}>{fmt(p.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudioPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    try { setInIframe(window.self !== window.top); } catch { setInIframe(true); }
  }, []);

  const login  = (t: string, u: AuthUser) => { setToken(t); setUser(u); };
  const logout = () => { setToken(null); setUser(null); };

  if (inIframe) {
    return (
      <div style={{
        minHeight: "100vh", background: "var(--bg)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "20px", padding: "40px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>
            TaskFlow API Studio
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.6, maxWidth: "280px" }}>
            El studio interactivo requiere autenticación. Abrí el sitio completo para probarlo.
          </p>
        </div>
        <button
          onClick={() => window.open("https://taskflow-api-pied.vercel.app/studio", "_blank", "noopener,noreferrer")}
          style={{
            background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "10px",
            padding: "10px 22px", fontSize: "13px", fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Abrir Studio ↗
        </button>
      </div>
    );
  }

  if (!token || !user) return <AuthPage onLogin={login} />;

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      <Dashboard token={token} user={user} onLogout={logout} />
    </div>
  );
}
