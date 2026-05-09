import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { createTaskSchema, taskQuerySchema } from "@/lib/schemas";
import { ok, err, unauthorized, serverError, parseBody } from "@/lib/response";

// GET /api/tasks — list tasks with filters and pagination
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(request.url);
  const queryResult = taskQuerySchema.safeParse(Object.fromEntries(searchParams));

  if (!queryResult.success) return err("Invalid query params", 400, queryResult.error.flatten());

  const { project_id, status, priority, assigned_to, page, limit, search } = queryResult.data;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("tasks")
    .select(
      "*, project:projects(id, name), assignee:users!assigned_to(id, name, avatar_url), creator:users!created_by(id, name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (project_id) query = query.eq("project_id", project_id);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);
  if (assigned_to) query = query.eq("assigned_to", assigned_to);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data: tasks, error, count } = await query;
  if (error) return serverError();

  return ok({ data: tasks, meta: { total: count ?? 0, page, limit } });
}

// POST /api/tasks — create a new task
export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data, error } = await parseBody(request, createTaskSchema);
  if (error) return err("Validation error", 400, error);

  // Verify the project exists
  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("id")
    .eq("id", data.project_id)
    .single();

  if (!project) return err("Project not found", 404);

  const { data: task, error: dbError } = await supabaseAdmin
    .from("tasks")
    .insert({ ...data, created_by: authUser.sub })
    .select()
    .single();

  if (dbError) return serverError();

  return ok({ data: task, status: 201 });
}
