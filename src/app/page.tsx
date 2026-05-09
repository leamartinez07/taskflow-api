"use client";
import { useState } from "react";
import Link from "next/link";
import {
  IconFolder, IconCheck, IconMsg, IconUser, IconKey, IconHealth,
  IconChevron, IconCopy, IconLock, IconGithub, IconDatabase, IconArrow
} from "@/components/icons";

const BASE_URL = "http://localhost:3000";

type GroupColor = { border: string; bg: string; icon: string; pill: { bg: string; text: string; border: string } };

const GROUPS: { group: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; color: GroupColor; description: string; routes: Route[] }[] = [
  {
    group: "Auth",
    Icon: IconKey,
    description: "Registro e inicio de sesión. Devuelve un JWT que se usa en todos los endpoints protegidos.",
    color: { border: "rgba(52,211,153,0.2)", bg: "rgba(52,211,153,0.04)", icon: "#34d399", pill: { bg: "rgba(52,211,153,0.1)", text: "#34d399", border: "rgba(52,211,153,0.25)" } },
    routes: [
      { method: "POST", path: "/api/auth/register", desc: "Crear cuenta de usuario", auth: false, body: `{ "name": "string", "email": "string", "password": "string (mayúscula + número)" }`, res: `{ "data": { "user": { "id": "uuid", "name": "..." }, "token": "eyJ..." } }` },
      { method: "POST", path: "/api/auth/login",    desc: "Autenticar y obtener JWT",    auth: false, body: `{ "email": "string", "password": "string" }`,                           res: `{ "data": { "user": { "id": "uuid", "name": "..." }, "token": "eyJ..." } }` },
      { method: "GET",  path: "/api/auth/me",       desc: "Perfil del usuario actual",   auth: true,  res: `{ "data": { "id": "uuid", "name": "...", "email": "..." } }` },
      { method: "PATCH",path: "/api/auth/me",       desc: "Actualizar nombre o avatar",  auth: true,  body: `{ "name"?: "string", "avatar_url"?: "string" }` },
    ],
  },
  {
    group: "Projects",
    Icon: IconFolder,
    description: "Cada usuario solo ve sus propios proyectos (filtrados por owner). Los proyectos NO son públicos.",
    color: { border: "rgba(157,91,244,0.2)", bg: "rgba(157,91,244,0.04)", icon: "#c084fc", pill: { bg: "rgba(157,91,244,0.1)", text: "#c084fc", border: "rgba(157,91,244,0.25)" } },
    routes: [
      { method: "GET",    path: "/api/projects",           desc: "Listar tus proyectos (solo los tuyos)", auth: true, query: "?status=active&page=1&limit=20", res: `{ "data": [{ "id": "uuid", "name": "...", "owner": { "id": "uuid", "name": "Leandro" } }] }` },
      { method: "POST",   path: "/api/projects",           desc: "Crear proyecto nuevo",                  auth: true, body: `{ "name": "string", "description"?: "string", "status"?: "active|archived|completed" }` },
      { method: "GET",    path: "/api/projects/:id",       desc: "Obtener proyecto con sus tareas",       auth: true },
      { method: "PATCH",  path: "/api/projects/:id",       desc: "Actualizar proyecto (solo el dueño)",   auth: true },
      { method: "DELETE", path: "/api/projects/:id",       desc: "Eliminar proyecto (solo el dueño)",     auth: true },
      { method: "GET",    path: "/api/projects/:id/tasks", desc: "Tareas del proyecto con creador",       auth: true, res: `{ "data": [{ "id": "uuid", "title": "...", "creator": { "name": "Leandro" } }] }` },
    ],
  },
  {
    group: "Tasks",
    Icon: IconCheck,
    description: "Las tareas pertenecen a un proyecto. Solo el creador puede eliminarlas; el creador o asignado puede editarlas.",
    color: { border: "rgba(251,191,36,0.2)", bg: "rgba(251,191,36,0.04)", icon: "#fbbf24", pill: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.25)" } },
    routes: [
      { method: "GET",    path: "/api/tasks",     desc: "Listar tareas con filtros",              auth: true, query: "?status=todo&priority=high&project_id=uuid" },
      { method: "POST",   path: "/api/tasks",     desc: "Crear tarea nueva",                     auth: true, body: `{ "title": "string", "project_id": "uuid", "status"?: "todo|in_progress|done", "priority"?: "low|medium|high|urgent", "due_date"?: "YYYY-MM-DD" }` },
      { method: "GET",    path: "/api/tasks/:id", desc: "Tarea con comentarios incluidos",       auth: true, res: `{ "data": { "title": "...", "comments": [...], "creator": { "name": "..." } } }` },
      { method: "PATCH",  path: "/api/tasks/:id", desc: "Editar tarea (creador o asignado)",     auth: true },
      { method: "DELETE", path: "/api/tasks/:id", desc: "Eliminar tarea (solo el creador)",      auth: true },
    ],
  },
  {
    group: "Comments",
    Icon: IconMsg,
    description: "Hilo de discusión por tarea. Permiten que el creador y asignado anoten avances, bloqueos o decisiones sobre cada tarea.",
    color: { border: "rgba(56,189,248,0.2)", bg: "rgba(56,189,248,0.04)", icon: "#38bdf8", pill: { bg: "rgba(56,189,248,0.1)", text: "#38bdf8", border: "rgba(56,189,248,0.25)" } },
    routes: [
      { method: "GET",  path: "/api/tasks/:id/comments", desc: "Listar comentarios de una tarea", auth: true, res: `{ "data": [{ "content": "...", "user": { "name": "Leandro" }, "created_at": "..." }] }` },
      { method: "POST", path: "/api/tasks/:id/comments", desc: "Agregar comentario a una tarea",  auth: true, body: `{ "content": "string" }` },
    ],
  },
  {
    group: "Health",
    Icon: IconHealth,
    description: "Estado de la API y timestamp del servidor.",
    color: { border: "rgba(122,109,148,0.2)", bg: "rgba(122,109,148,0.04)", icon: "#7a6d94", pill: { bg: "rgba(122,109,148,0.1)", text: "#7a6d94", border: "rgba(122,109,148,0.2)" } },
    routes: [
      { method: "GET", path: "/api/health", desc: "Estado y uptime de la API", auth: false, res: `{ "status": "ok", "timestamp": "2026-05-06T01:00:00Z" }` },
    ],
  },
];

type Route = {
  method: string; path: string; desc: string; auth: boolean;
  body?: string; res?: string; query?: string;
};

const METHOD_STYLE: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  GET:    { color: "#93c5fd", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)",  bar: "#3b82f6" },
  POST:   { color: "#6ee7b7", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  bar: "#10b981" },
  PATCH:  { color: "#fcd34d", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  bar: "#f59e0b" },
  DELETE: { color: "#fca5a5", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   bar: "#ef4444" },
};

const totalRoutes = GROUPS.reduce((a, g) => a + g.routes.length, 0);

export default function DocsPage() {
  const [open, setOpen]     = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const toggle = (k: string) => setOpen(p => p === k ? null : k);
  const copy   = () => { navigator.clipboard.writeText(BASE_URL); setCopied(true); setTimeout(() => setCopied(false), 1800); };

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-50 px-6 py-3" style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,8,18,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 0 20px rgba(157,91,244,0.4)" }}>T</div>
            <span className="font-bold">TaskFlow <span style={{ color: "var(--brand)" }}>API</span></span>
            <span className="rounded-full px-2 py-0.5 text-[10px]"
              style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>v1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
              <span className="text-[11px]" style={{ color: "#34d399" }}>online</span>
            </span>
            <Link href="/studio" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Abrir App <IconArrow className="w-3 h-3" />
            </Link>
            <Link href="/explorer" className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
              <IconDatabase className="w-3.5 h-3.5" /> Explorer
            </Link>
            <Link href="https://github.com/leamartinez07" target="_blank" className="rounded-lg p-2 transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
              <IconGithub className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden px-6 py-16" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(157,91,244,0.14) 0%, transparent 70%)" }} />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: "var(--accent)" }}>
            REST API · Documentación
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight leading-none md:text-5xl" style={{ color: "var(--text)" }}>
            Task & Project<br />
            <span style={{ background: "linear-gradient(135deg, #c084fc, #9d5bf4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Management API
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
            API REST production-ready con Next.js 15, Supabase PostgreSQL, autenticación JWT stateless y validación Zod.
            Cada usuario gestiona sus propios proyectos y tareas con hilos de comentarios por tarea.
          </p>

          {/* BASE URL pill */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-mono text-sm"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted)" }}>BASE URL</span>
              <span style={{ color: "var(--text)" }}>{BASE_URL}</span>
            </div>
            <button onClick={copy} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs transition-opacity hover:opacity-70 active:scale-95"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)" }}>
              <IconCopy className="w-3.5 h-3.5" /> {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          {/* STATS row */}
          <div className="mt-7 flex flex-wrap gap-3">
            {[
              { label: "Endpoints", value: totalRoutes },
              { label: "Grupos", value: GROUPS.length },
              { label: "Auth", value: "JWT" },
              { label: "DB", value: "PostgreSQL" },
              { label: "Validación", value: "Zod" },
              { label: "Framework", value: "Next.js 15" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-2.5 text-center"
                style={{ border: "1px solid var(--border)", background: "var(--panel)", minWidth: "76px" }}>
                <div className="text-lg font-bold" style={{ color: "var(--text)" }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">

        {/* AUTH HEADER */}
        <div className="rounded-2xl p-5 flex items-start gap-4"
          style={{ border: "1px solid rgba(157,91,244,0.2)", background: "rgba(157,91,244,0.05)" }}>
          <div className="flex-shrink-0 rounded-xl p-2.5 mt-0.5" style={{ background: "rgba(157,91,244,0.15)" }}>
            <IconLock className="w-5 h-5" style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Autenticación JWT</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Los endpoints marcados con <IconLock className="inline w-3 h-3 mx-1" style={{ color: "var(--muted)" }} /> requieren el token JWT en el header de cada request:
            </p>
            <div className="mt-3 rounded-xl px-4 py-3 font-mono text-xs overflow-x-auto"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--brand)" }}>
              Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </div>
          </div>
        </div>

        {/* ENDPOINT GROUPS */}
        {GROUPS.map(group => (
          <section key={group.group}>
            {/* group header */}
            <div className="mb-4 flex flex-wrap items-start gap-3">
              <div className="rounded-xl p-2 mt-0.5" style={{ border: `1px solid ${group.color.border}`, background: group.color.bg }}>
                <group.Icon className="w-4 h-4" style={{ color: group.color.icon }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>{group.group}</h2>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: group.color.pill.bg, color: group.color.pill.text, border: `1px solid ${group.color.pill.border}` }}>
                    {group.routes.length} ruta{group.routes.length > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{group.description}</p>
              </div>
            </div>

            {/* routes */}
            <div className="space-y-2">
              {group.routes.map(route => {
                const k   = `${route.method}-${route.path}`;
                const isO = open === k;
                const ms  = METHOD_STYLE[route.method];
                return (
                  <div key={k} onClick={() => toggle(k)} className="rounded-2xl cursor-pointer transition-all overflow-hidden"
                    style={{
                      border: `1px solid ${isO ? "var(--dim)" : "var(--border)"}`,
                      background: isO ? "var(--surface)" : "var(--panel)",
                    }}>
                    {/* collapsed row */}
                    <div className="flex items-center gap-3 px-4 py-3.5">
                      <div className="h-7 w-0.5 rounded-full flex-shrink-0" style={{ background: ms.bar }} />
                      <span className="rounded-md px-2 py-0.5 text-[11px] font-mono font-bold flex-shrink-0"
                        style={{ background: ms.bg, color: ms.color, border: `1px solid ${ms.border}` }}>
                        {route.method}
                      </span>
                      <code className="flex-1 text-sm font-mono truncate" style={{ color: "var(--text)" }}>
                        {route.path}
                        {route.query && <span style={{ color: "var(--muted)" }}>{route.query}</span>}
                      </code>
                      <span className="hidden sm:block text-[13px] flex-shrink-0 max-w-xs truncate" style={{ color: "var(--muted)" }}>
                        {route.desc}
                      </span>
                      {route.auth && (
                        <span className="flex-shrink-0 rounded-md px-1.5 py-1" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
                          <IconLock className="w-3 h-3" style={{ color: "var(--dim)" }} />
                        </span>
                      )}
                      <IconChevron className={`w-4 h-4 flex-shrink-0 transition-transform ${isO ? "rotate-180" : ""}`}
                        style={{ color: "var(--dim)" }} />
                    </div>

                    {/* expanded content */}
                    {isO && (
                      <div className="px-5 pb-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{route.desc}</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {route.body && (
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                                Request Body
                              </p>
                              <pre className="rounded-xl px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#6ee7b7" }}>
                                {route.body}
                              </pre>
                            </div>
                          )}
                          {route.res && (
                            <div>
                              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                                Response
                              </p>
                              <pre className="rounded-xl px-4 py-3 text-xs font-mono whitespace-pre-wrap overflow-x-auto"
                                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#93c5fd" }}>
                                {route.res}
                              </pre>
                            </div>
                          )}
                        </div>
                        <p className="mt-4 font-mono text-[11px]" style={{ color: "var(--dim)" }}>
                          {BASE_URL}{route.path}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* MODELO DE PRIVACIDAD */}
        <section className="rounded-2xl p-6" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Modelo de privacidad y permisos
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { Icon: IconUser, title: "Proyectos privados", desc: "Cada usuario solo ve los proyectos que él creó. Los proyectos NO son accesibles por otros usuarios." },
              { Icon: IconCheck, title: "Tareas compartidas", desc: "El creador puede editar y eliminar. Si asignás la tarea a otro usuario, ese también puede editarla." },
              { Icon: IconMsg, title: "Comentarios por tarea", desc: "Hilo de discusión por tarea: el creador y asignado pueden anotar avances, bloqueos o decisiones." },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-xl p-4" style={{ background: "var(--panel)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{title}</p>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STACK */}
        <section className="rounded-2xl p-6" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Tech Stack</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Next.js 15",  desc: "App Router + API Routes" },
              { name: "Supabase",    desc: "PostgreSQL gestionado" },
              { name: "JWT (jose)",  desc: "Auth stateless" },
              { name: "Zod",         desc: "Validación de schemas" },
            ].map(t => (
              <div key={t.name} className="rounded-xl px-4 py-3" style={{ border: "1px solid var(--border)", background: "var(--panel)" }}>
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{t.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="pb-6 text-center text-xs" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", color: "var(--dim)" }}>
          Construido por{" "}
          <Link href="https://github.com/leamartinez07" target="_blank" className="hover:underline" style={{ color: "var(--brand)" }}>
            Leandro Martinez
          </Link>
          {" "}· TaskFlow API · 2026
        </footer>
      </div>
    </main>
  );
}
