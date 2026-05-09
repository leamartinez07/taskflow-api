// ─────────────────────────────────────────────────────────────────────────────
// Domain types — mirror the Supabase tables
// ─────────────────────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  status: "active" | "archived" | "completed";
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  project_id: string;
  assigned_to: string | null;
  created_by: string;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type Comment = {
  id: string;
  content: string;
  task_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// API response helpers
// ─────────────────────────────────────────────────────────────────────────────

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: { total?: number; page?: number; limit?: number };
};

export type ApiError = {
  success: false;
  error: string;
  details?: unknown;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─────────────────────────────────────────────────────────────────────────────
// JWT payload
// ─────────────────────────────────────────────────────────────────────────────

export type JwtPayload = {
  sub: string;   // user id
  email: string;
  name: string;
};
