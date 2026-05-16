"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconFolder, IconCheck, IconMsg, IconKey, IconHealth,
  IconChevron, IconCopy, IconLock, IconGithub, IconDatabase, IconArrow
} from "@/components/icons";

const BASE_URL = "https://taskflow-api-pied.vercel.app";

type Route = {
  method: string; path: string; desc: string; auth: boolean;
  body?: string; res?: string; query?: string; note?: string;
};

const GROUPS: { label: string; Icon: React.FC<React.SVGProps<SVGSVGElement>>; desc: string; color: string; routes: Route[] }[] = [
  {
    label: "Auth", Icon: IconKey, color: "rgba(52,211,153,0.6)",
    desc: "Registro e inicio de sesión. Devuelve un JWT para usar en los endpoints protegidos.",
    routes: [
      { method: "POST", path: "/api/auth/register", desc: "Crear cuenta de usuario", auth: false, note: "Password: mín. 8 chars, 1 mayúscula, 1 número",
        body: `{ "name": "string", "email": "string", "password": "string" }`,
        res:  `{ "success": true, "data": { "user": { "id": "uuid", "name": "..." }, "token": "eyJ..." } }` },
      { method: "POST", path: "/api/auth/login",    desc: "Autenticar y obtener JWT", auth: false,
        body: `{ "email": "string", "password": "string" }`,
        res:  `{ "success": true, "data": { "user": { "id": "uuid", "name": "..." }, "token": "eyJ..." } }` },
      { method: "GET",  path: "/api/auth/me",       desc: "Perfil del usuario autenticado", auth: true,
        res:  `{ "success": true, "data": { "id": "uuid", "name": "...", "email": "..." } }` },
      { method: "PATCH",path: "/api/auth/me",       desc: "Actualizar nombre o avatar", auth: true,
        body: `{ "name"?: "string", "avatar_url"?: "string" }` },
    ],
  },
  {
    label: "Projects", Icon: IconFolder, color: "rgba(192,132,252,0.6)",
    desc: "Cada usuario gestiona solo sus propios proyectos. No son accesibles por otros usuarios.",
    routes: [
      { method: "GET",    path: "/api/projects",           desc: "Listar proyectos (paginado)", auth: true, query: "?status=active&page=1&limit=20" },
      { method: "POST",   path: "/api/projects",           desc: "Crear proyecto nuevo", auth: true,
        body: `{ "name": "string", "description"?: "string", "status"?: "active|archived|completed" }` },
      { method: "GET",    path: "/api/projects/:id",       desc: "Proyecto con sus tareas", auth: true },
      { method: "PATCH",  path: "/api/projects/:id",       desc: "Editar proyecto (solo owner)", auth: true },
      { method: "DELETE", path: "/api/projects/:id",       desc: "Eliminar proyecto (solo owner)", auth: true },
      { method: "GET",    path: "/api/projects/:id/tasks", desc: "Tareas de un proyecto", auth: true },
    ],
  },
  {
    label: "Tasks", Icon: IconCheck, color: "rgba(251,191,36,0.6)",
    desc: "Las tareas pertenecen a un proyecto. Solo el creador puede eliminarlas.",
    routes: [
      { method: "GET",    path: "/api/tasks",     desc: "Listar tareas con filtros", auth: true, query: "?project_id=uuid&status=todo&priority=high" },
      { method: "POST",   path: "/api/tasks",     desc: "Crear tarea nueva", auth: true,
        body: `{ "title": "string", "project_id": "uuid", "status"?: "todo|in_progress|done|cancelled", "priority"?: "low|medium|high|urgent", "due_date"?: "YYYY-MM-DD" }` },
      { method: "GET",    path: "/api/tasks/:id", desc: "Tarea con comentarios incluidos", auth: true },
      { method: "PATCH",  path: "/api/tasks/:id", desc: "Editar tarea (creador o asignado)", auth: true },
      { method: "DELETE", path: "/api/tasks/:id", desc: "Eliminar tarea (solo el creador)", auth: true },
    ],
  },
  {
    label: "Comments", Icon: IconMsg, color: "rgba(56,189,248,0.6)",
    desc: "Hilo de discusión por tarea para anotar avances, bloqueos o decisiones.",
    routes: [
      { method: "GET",  path: "/api/tasks/:id/comments", desc: "Listar comentarios de una tarea", auth: true },
      { method: "POST", path: "/api/tasks/:id/comments", desc: "Agregar comentario a una tarea", auth: true,
        body: `{ "content": "string" }` },
    ],
  },
  {
    label: "Health", Icon: IconHealth, color: "rgba(122,109,148,0.6)",
    desc: "Estado de la API y timestamp del servidor.",
    routes: [
      { method: "GET", path: "/api/health", desc: "Estado y uptime de la API", auth: false,
        res: `{ "status": "ok", "timestamp": "2026-05-15T00:00:00.000Z" }` },
    ],
  },
];

const METHOD: Record<string, { color: string; bg: string; border: string }> = {
  GET:    { color: "#93c5fd", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)"  },
  POST:   { color: "#6ee7b7", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)"  },
  PATCH:  { color: "#fcd34d", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"  },
  DELETE: { color: "#fca5a5", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)"   },
};

const totalRoutes = GROUPS.reduce((a, g) => a + g.routes.length, 0);

export default function DocsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied]     = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    try { setInIframe(window.self !== window.top); } catch { setInIframe(true); }
  }, []);

  const toggle = (k: string) => setExpanded(p => p === k ? null : k);
  const copy   = () => {
    navigator.clipboard.writeText(BASE_URL).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };
  const openSite = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <main className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>

      {/* iframe banner */}
      {inIframe && (
        <div className="flex items-center justify-between gap-3 px-5 py-2 text-xs"
          style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
          <span>Vista previa — algunas interacciones requieren abrir el sitio completo</span>
          <button onClick={() => openSite(BASE_URL)}
            className="rounded px-2.5 py-1 text-[11px] transition-opacity hover:opacity-80"
            style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--text)", cursor: "pointer" }}>
            Abrir sitio ↗
          </button>
        </div>
      )}

      {/* nav */}
      <nav className="sticky z-50 border-b px-6 py-3.5"
        style={{ top: inIframe ? "36px" : 0, borderColor: "var(--border)", background: "rgba(10,8,18,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white shadow-lg"
              style={{ background: "var(--accent)", boxShadow: "0 0 18px rgba(157,91,244,0.35)" }}>T</div>
            <span className="font-bold tracking-tight" style={{ color: "var(--text)" }}>
              TaskFlow <span style={{ color: "var(--brand)" }}>API</span>
            </span>
            <span className="rounded px-2 py-0.5 font-mono text-[10px]"
              style={{ border: "1px solid var(--border)", color: "var(--dim)" }}>v1.0.0</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#34d399" }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
              online
            </span>
            <button onClick={() => openSite(`${BASE_URL}/studio`)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "#fff", cursor: "pointer", border: "none" }}>
              Abrir App <IconArrow className="h-3 w-3" />
            </button>
            <button onClick={() => openSite(`${BASE_URL}/explorer`)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer" }}>
              <IconDatabase className="h-3.5 w-3.5" /> Explorer
            </button>
            <button onClick={() => openSite("https://github.com/leamartinez07/taskflow-api")}
              className="rounded-lg p-2 transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--muted)", cursor: "pointer" }}>
              <IconGithub className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">

        {/* intro */}
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
              REST API · Documentación
            </p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl" style={{ color: "var(--text)" }}>
              Task &amp; Project<br />
              <span style={{ color: "var(--brand)" }}>Management API</span>
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              API REST lista para producción con Next.js 15, Supabase PostgreSQL, autenticación JWT stateless y validación Zod.
            </p>
          </div>

          {/* base url */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-mono text-sm"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>BASE URL</span>
              <span style={{ color: "var(--text)" }}>{BASE_URL}</span>
            </div>
            <button onClick={copy}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs transition-all hover:opacity-70 active:scale-95"
              style={{ border: "1px solid var(--border)", background: "var(--surface)", color: copied ? "#34d399" : "var(--muted)", cursor: "pointer" }}>
              <IconCopy className="h-3.5 w-3.5" /> {copied ? "¡Copiado!" : "Copiar"}
            </button>
          </div>

          {/* stats */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Endpoints", value: totalRoutes },
              { label: "Auth",      value: "JWT" },
              { label: "DB",        value: "PostgreSQL" },
              { label: "Validación",value: "Zod" },
              { label: "Framework", value: "Next.js 15" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-2 text-center"
                style={{ border: "1px solid var(--border)", background: "var(--panel)", minWidth: "72px" }}>
                <div className="text-base font-bold" style={{ color: "var(--text)" }}>{s.value}</div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* auth note */}
        <div className="flex items-start gap-4 rounded-2xl p-5"
          style={{ border: "1px solid rgba(157,91,244,0.2)", background: "rgba(157,91,244,0.05)" }}>
          <div className="flex-shrink-0 rounded-xl p-2.5" style={{ background: "rgba(157,91,244,0.12)" }}>
            <IconLock className="h-5 w-5" style={{ color: "var(--brand)" }} />
          </div>
          <div>
            <p className="mb-1 font-semibold text-sm" style={{ color: "var(--text)" }}>Autenticación JWT</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Los endpoints marcados con <IconLock className="inline h-3 w-3 mx-1" style={{ color: "var(--muted)" }} /> requieren:
            </p>
            <code className="mt-2 block rounded-lg px-3 py-2 font-mono text-xs"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--brand)" }}>
              Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            </code>
          </div>
        </div>

        {/* groups */}
        <div className="space-y-10">
          {GROUPS.map(group => (
            <section key={group.label}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ border: `1px solid ${group.color.replace("0.6", "0.25")}`, background: group.color.replace("0.6", "0.07") }}>
                  <group.Icon className="h-4 w-4" style={{ color: group.color.replace("0.6", "1") }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold" style={{ color: "var(--text)" }}>{group.label}</h2>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "var(--panel)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                      {group.routes.length} ruta{group.routes.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs leading-snug mt-0.5" style={{ color: "var(--dim)" }}>{group.desc}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
                {group.routes.map((route, i) => {
                  const key   = `${route.method}-${route.path}`;
                  const isO   = expanded === key;
                  const hasD  = !!(route.body || route.res || route.query);
                  const ms    = METHOD[route.method];

                  return (
                    <div key={key} style={{ borderBottom: i < group.routes.length - 1 ? `1px solid var(--border)` : "none" }}>
                      {/* row */}
                      <div
                        onClick={() => hasD && toggle(key)}
                        className="flex items-center gap-3 px-4 py-3 transition-colors"
                        style={{ cursor: hasD ? "pointer" : "default", background: isO ? "var(--panel)" : "transparent" }}
                        onMouseEnter={e => { if (hasD && !isO) (e.currentTarget as HTMLElement).style.background = "var(--panel)"; }}
                        onMouseLeave={e => { if (!isO) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span className="flex-shrink-0 rounded-md px-2.5 py-0.5 font-mono text-[11px] font-bold"
                          style={{ color: ms.color, background: ms.bg, border: `1px solid ${ms.border}`, minWidth: "52px", textAlign: "center" }}>
                          {route.method}
                        </span>
                        <code className="flex-1 truncate font-mono text-sm" style={{ color: "var(--text)" }}>
                          {route.path}
                          {route.query && <span style={{ color: "var(--dim)" }}>{route.query}</span>}
                        </code>
                        <span className="hidden truncate text-xs sm:block" style={{ color: "var(--muted)", maxWidth: "220px" }}>
                          {route.desc}
                        </span>
                        {route.auth && (
                          <span className="flex-shrink-0 rounded-md p-1.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                            <IconLock className="h-3 w-3" style={{ color: "var(--dim)" }} />
                          </span>
                        )}
                        {hasD && (
                          <IconChevron className={`h-4 w-4 flex-shrink-0 transition-transform ${isO ? "rotate-180" : ""}`}
                            style={{ color: "var(--dim)" }} />
                        )}
                      </div>

                      {/* expanded */}
                      {isO && (
                        <div className="px-5 pb-5 pt-4 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                          {route.note && (
                            <p className="rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.2)", color: "#fcd34d" }}>
                              ⚠ {route.note}
                            </p>
                          )}
                          {route.query && (
                            <div>
                              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Query params</p>
                              <code className="font-mono text-xs" style={{ color: "var(--muted)" }}>{route.query}</code>
                            </div>
                          )}
                          {(route.body || route.res) && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              {route.body && (
                                <div>
                                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Request body</p>
                                  <pre className="rounded-xl px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto"
                                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#6ee7b7" }}>
                                    {route.body}
                                  </pre>
                                </div>
                              )}
                              {route.res && (
                                <div>
                                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Respuesta</p>
                                  <pre className="rounded-xl px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto"
                                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "#93c5fd" }}>
                                    {route.res}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>
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
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t pb-6 pt-5 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--dim)" }}>
          <span className="font-mono">taskflow-api · Next.js 15 · Supabase · 2025</span>
          <button onClick={() => openSite("https://leandromartinez.vercel.app")}
            className="transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            leandro martinez
          </button>
        </footer>
      </div>
    </main>
  );
}
