"use client";
import { useState, useEffect } from "react";

const BASE_URL = "https://taskflow-api-pied.vercel.app";
const GITHUB_URL = "https://github.com/leamartinez07/taskflow-api";

type Route = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  desc: string;
  auth: boolean;
  body?: string;
  res?: string;
  query?: string;
  note?: string;
};

type Group = { label: string; tag: string; routes: Route[] };

const GROUPS: Group[] = [
  {
    label: "Auth", tag: "auth",
    routes: [
      {
        method: "POST", path: "/api/auth/register",
        desc: "Crear cuenta nueva. Devuelve el usuario y un JWT listo para usar.",
        auth: false,
        body: `{\n  "name":     "string (mín. 2 caracteres)",\n  "email":    "string válido",\n  "password": "mín. 8 chars, 1 mayúscula, 1 número"\n}`,
        res: `{\n  "success": true,\n  "data": {\n    "user":  { "id": "uuid", "name": "...", "email": "..." },\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n  }\n}`,
        note: "El password requiere al menos una mayúscula y un número.",
      },
      {
        method: "POST", path: "/api/auth/login",
        desc: "Autenticar usuario. Devuelve JWT.",
        auth: false,
        body: `{\n  "email":    "string",\n  "password": "string"\n}`,
        res: `{\n  "success": true,\n  "data": {\n    "user":  { "id": "uuid", "name": "..." },\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n  }\n}`,
      },
      {
        method: "GET", path: "/api/auth/me",
        desc: "Perfil del usuario autenticado.",
        auth: true,
        res: `{\n  "success": true,\n  "data": { "id": "uuid", "name": "...", "email": "...", "avatar_url": null }\n}`,
      },
      {
        method: "PATCH", path: "/api/auth/me",
        desc: "Actualizar nombre o avatar del usuario actual.",
        auth: true,
        body: `{\n  "name"?:       "string",\n  "avatar_url"?: "string (URL)"\n}`,
      },
    ],
  },
  {
    label: "Projects", tag: "projects",
    routes: [
      {
        method: "GET", path: "/api/projects",
        desc: "Listar proyectos del usuario autenticado.",
        auth: true, query: "?status=active&page=1&limit=20",
        res: `{\n  "success": true,\n  "data": [{ "id": "uuid", "name": "...", "status": "active" }],\n  "meta": { "page": 1, "limit": 20, "total": 3 }\n}`,
      },
      {
        method: "POST", path: "/api/projects",
        desc: "Crear proyecto nuevo.",
        auth: true,
        body: `{\n  "name":         "string (requerido)",\n  "description"?: "string",\n  "status"?:      "active | archived | completed"\n}`,
      },
      { method: "GET",    path: "/api/projects/:id",       desc: "Obtener proyecto junto con sus tareas.", auth: true },
      { method: "PATCH",  path: "/api/projects/:id",       desc: "Editar proyecto. Solo disponible para el owner.", auth: true },
      { method: "DELETE", path: "/api/projects/:id",       desc: "Eliminar proyecto. Solo disponible para el owner.", auth: true },
      { method: "GET",    path: "/api/projects/:id/tasks", desc: "Listar tareas de un proyecto específico.", auth: true },
    ],
  },
  {
    label: "Tasks", tag: "tasks",
    routes: [
      {
        method: "GET", path: "/api/tasks",
        desc: "Listar tareas con filtros opcionales.",
        auth: true, query: "?project_id=uuid&status=todo&priority=high&search=texto",
      },
      {
        method: "POST", path: "/api/tasks",
        desc: "Crear tarea nueva dentro de un proyecto.",
        auth: true,
        body: `{\n  "title":      "string (requerido)",\n  "project_id": "uuid (requerido)",\n  "status"?:    "todo | in_progress | done | cancelled",\n  "priority"?:  "low | medium | high | urgent",\n  "due_date"?:  "YYYY-MM-DD"\n}`,
      },
      { method: "GET",    path: "/api/tasks/:id", desc: "Obtener tarea con sus comentarios incluidos.", auth: true },
      { method: "PATCH",  path: "/api/tasks/:id", desc: "Editar tarea. Disponible para el creador o el asignado.", auth: true },
      { method: "DELETE", path: "/api/tasks/:id", desc: "Eliminar tarea. Solo el creador puede hacerlo.", auth: true },
    ],
  },
  {
    label: "Comments", tag: "comments",
    routes: [
      {
        method: "GET", path: "/api/tasks/:id/comments",
        desc: "Listar comentarios de una tarea.", auth: true,
        res: `{\n  "success": true,\n  "data": [{ "id": "uuid", "content": "...", "user": { "name": "..." }, "created_at": "..." }]\n}`,
      },
      {
        method: "POST", path: "/api/tasks/:id/comments",
        desc: "Agregar comentario a una tarea.", auth: true,
        body: `{ "content": "string (requerido)" }`,
      },
    ],
  },
  {
    label: "Health", tag: "health",
    routes: [
      {
        method: "GET", path: "/api/health",
        desc: "Estado del servidor.", auth: false,
        res: `{ "status": "ok", "timestamp": "2026-05-15T00:00:00.000Z" }`,
      },
    ],
  },
];

const METHOD: Record<string, { fg: string; bg: string; label: string }> = {
  GET:    { fg: "#5eead4", bg: "rgba(20,184,166,0.1)",  label: "GET"   },
  POST:   { fg: "#86efac", bg: "rgba(34,197,94,0.1)",   label: "POST"  },
  PATCH:  { fg: "#fcd34d", bg: "rgba(234,179,8,0.1)",   label: "PATCH" },
  DELETE: { fg: "#f87171", bg: "rgba(239,68,68,0.08)",  label: "DEL"   },
};

export default function DocsPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [inIframe, setInIframe] = useState(false);
  const [copied, setCopied]     = useState(false);

  useEffect(() => {
    try { setInIframe(window.self !== window.top); } catch { setInIframe(true); }
  }, []);

  const toggle = (key: string) => setExpanded(p => p === key ? null : key);
  const copy   = () => {
    navigator.clipboard.writeText(BASE_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const openSite = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const totalRoutes = GROUPS.reduce((a, g) => a + g.routes.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e4e4e7", fontFamily: "'Inter', system-ui, sans-serif", fontSize: "14px" }}>

      {/* iframe banner */}
      {inIframe && (
        <div style={{ background: "#111", borderBottom: "1px solid #1c1c1c", padding: "7px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <span style={{ fontSize: "12px", color: "#52525b" }}>
            Vista previa — abrí el sitio completo para interactuar con la API
          </span>
          <button onClick={() => openSite(BASE_URL)} style={{ fontSize: "11px", color: "#a1a1aa", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "5px", padding: "3px 10px", cursor: "pointer" }}>
            Abrir ↗
          </button>
        </div>
      )}

      {/* header */}
      <header style={{ borderBottom: "1px solid #1c1c1c", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: inIframe ? "37px" : 0, zIndex: 40, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "15px", color: "#f4f4f5" }}>
            taskflow<span style={{ color: "#22c55e" }}>/api</span>
          </span>
          <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "3px", border: "1px solid #222", color: "#52525b", fontFamily: "monospace" }}>v1.0</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={() => openSite(`${BASE_URL}/studio`)} style={{ fontSize: "12px", color: "#fff", background: "#22c55e", border: "none", borderRadius: "6px", padding: "5px 14px", cursor: "pointer", fontWeight: 600 }}>
            Abrir App ↗
          </button>
          <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#22c55e" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
            online
          </span>
          <button onClick={() => openSite(GITHUB_URL)} style={{ fontSize: "12px", color: "#71717a", background: "transparent", border: "1px solid #27272a", borderRadius: "6px", padding: "5px 12px", cursor: "pointer" }}>
            GitHub ↗
          </button>
        </div>
      </header>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 24px 72px" }}>

        {/* intro */}
        <div style={{ marginBottom: "44px" }}>
          <h1 style={{ fontSize: "27px", fontWeight: 700, color: "#fafafa", marginBottom: "10px", letterSpacing: "-0.5px" }}>
            Documentación de la API
          </h1>
          <p style={{ color: "#71717a", lineHeight: 1.75, maxWidth: "560px" }}>
            REST API para gestión de proyectos y tareas. Autenticación JWT, control de acceso por rol y validación con Zod.
          </p>

          {/* base url */}
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#111", border: "1px solid #1c1c1c", borderRadius: "8px", padding: "9px 16px", fontFamily: "monospace", fontSize: "13px" }}>
              <span style={{ color: "#3f3f46", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>BASE</span>
              <span style={{ color: "#d4d4d8" }}>{BASE_URL}</span>
            </div>
            <button onClick={copy} style={{ fontSize: "12px", color: copied ? "#22c55e" : "#52525b", background: "#111", border: "1px solid #1c1c1c", borderRadius: "8px", padding: "9px 14px", cursor: "pointer" }}>
              {copied ? "✓ copiado" : "copiar"}
            </button>
          </div>

          {/* stats */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
            {[["endpoints", String(totalRoutes)], ["auth", "JWT"], ["db", "PostgreSQL"], ["validación", "Zod"], ["runtime", "Next.js 15"]].map(([k, v]) => (
              <div key={k} style={{ background: "#111", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "7px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#3f3f46" }}>{k}</span>
                <span style={{ fontSize: "11px", color: "#a1a1aa", fontFamily: "monospace" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* auth note */}
        <div style={{ background: "#0d1117", border: "1px solid #1c2a1c", borderLeft: "3px solid #22c55e", borderRadius: "8px", padding: "14px 18px", marginBottom: "44px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{ fontFamily: "monospace", fontSize: "10px", color: "#22c55e", marginTop: "2px", whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.08em" }}>Auth</span>
            <p style={{ color: "#71717a", margin: 0, lineHeight: 1.7, fontSize: "13px" }}>
              Los endpoints protegidos requieren{" "}
              <code style={{ fontFamily: "monospace", fontSize: "12px", color: "#d4d4d8", background: "#161616", padding: "1px 6px", borderRadius: "4px" }}>
                Authorization: Bearer &lt;token&gt;
              </code>
              {" "}en el header. El token lo obtenés en{" "}
              <code style={{ fontFamily: "monospace", fontSize: "12px", color: "#86efac" }}>/api/auth/login</code>.
            </p>
          </div>
        </div>

        {/* endpoint groups */}
        <div style={{ display: "flex", flexDirection: "column", gap: "44px" }}>
          {GROUPS.map(group => (
            <section key={group.label}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#22c55e", letterSpacing: "0.06em" }}>/{group.tag}</span>
                <span style={{ height: "1px", flex: 1, background: "#1c1c1c" }} />
                <span style={{ fontSize: "11px", color: "#3f3f46" }}>{group.routes.length} ruta{group.routes.length > 1 ? "s" : ""}</span>
              </div>

              <div style={{ border: "1px solid #1c1c1c", borderRadius: "10px", overflow: "hidden", background: "#0d0d0d" }}>
                {group.routes.map((route, idx) => {
                  const key    = `${route.method}-${route.path}`;
                  const isOpen = expanded === key;
                  const hasDetail = !!(route.body || route.res || route.query || route.note);
                  const ms     = METHOD[route.method];

                  return (
                    <div key={key} style={{ borderBottom: idx < group.routes.length - 1 ? "1px solid #141414" : "none" }}>
                      {/* row */}
                      <div
                        onClick={() => hasDetail && toggle(key)}
                        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", cursor: hasDetail ? "pointer" : "default", background: isOpen ? "#111" : "transparent", transition: "background 0.1s" }}
                        onMouseEnter={e => { if (hasDetail && !isOpen) (e.currentTarget as HTMLElement).style.background = "#0f0f0f"; }}
                        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <span style={{ fontFamily: "monospace", fontSize: "10px", fontWeight: 700, color: ms.fg, background: ms.bg, padding: "2px 7px", borderRadius: "4px", flexShrink: 0, minWidth: "42px", textAlign: "center" }}>
                          {ms.label}
                        </span>
                        <code style={{ fontFamily: "monospace", fontSize: "13px", color: "#e4e4e7", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {route.path}
                          {route.query && <span style={{ color: "#3f3f46" }}>{route.query}</span>}
                        </code>
                        {route.auth && (
                          <span style={{ fontSize: "10px", color: "#3f3f46", border: "1px solid #27272a", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", flexShrink: 0 }}>auth</span>
                        )}
                        {hasDetail && (
                          <span style={{ fontSize: "11px", color: "#3f3f46", flexShrink: 0, display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                        )}
                      </div>

                      {/* description */}
                      <div style={{ padding: "0 16px 10px calc(16px + 42px + 12px)" }}>
                        <span style={{ fontSize: "12px", color: "#52525b" }}>{route.desc}</span>
                        {route.note && (
                          <span style={{ fontSize: "11px", color: "#a16207", background: "#1c1004", border: "1px solid #2c1a06", borderRadius: "4px", padding: "1px 7px", marginLeft: "8px", display: "inline-block" }}>
                            ⚠ {route.note}
                          </span>
                        )}
                      </div>

                      {/* expanded */}
                      {isOpen && hasDetail && (
                        <div style={{ borderTop: "1px solid #141414", padding: "16px", paddingLeft: "calc(16px + 42px + 12px)", display: "flex", flexDirection: "column", gap: "14px" }}>
                          {route.query && (
                            <div>
                              <p style={{ fontSize: "10px", color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Query params</p>
                              <code style={{ fontFamily: "monospace", fontSize: "12px", color: "#71717a" }}>{route.query}</code>
                            </div>
                          )}
                          {route.body && (
                            <div>
                              <p style={{ fontSize: "10px", color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Request body</p>
                              <pre style={{ fontFamily: "monospace", fontSize: "12px", color: "#86efac", background: "#0a0a0a", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "12px 14px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{route.body}</pre>
                            </div>
                          )}
                          {route.res && (
                            <div>
                              <p style={{ fontSize: "10px", color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Respuesta</p>
                              <pre style={{ fontFamily: "monospace", fontSize: "12px", color: "#7dd3fc", background: "#0a0a0a", border: "1px solid #1c1c1c", borderRadius: "6px", padding: "12px 14px", margin: 0, overflowX: "auto", lineHeight: 1.6 }}>{route.res}</pre>
                            </div>
                          )}
                          <p style={{ fontFamily: "monospace", fontSize: "11px", color: "#27272a", margin: 0 }}>{BASE_URL}{route.path}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* footer */}
        <footer style={{ marginTop: "60px", paddingTop: "20px", borderTop: "1px solid #141414", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#27272a", fontFamily: "monospace" }}>taskflow-api · Next.js 15 · Supabase · 2025</span>
          <button onClick={() => openSite("https://leandromartinez.vercel.app")} style={{ fontSize: "11px", color: "#3f3f46", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", textDecorationColor: "#27272a" }}>
            leandro martinez
          </button>
        </footer>
      </div>
    </div>
  );
}
