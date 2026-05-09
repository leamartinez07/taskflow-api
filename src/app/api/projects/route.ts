import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { createProjectSchema } from "@/lib/schemas";
import { ok, err, unauthorized, serverError, parseBody } from "@/lib/response";

// GET /api/projects — list all projects owned by the authenticated user
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("projects")
    .select("*, owner:users(id, name, email, avatar_url)", { count: "exact" })
    .eq("owner_id", authUser.sub)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);

  const { data: projects, error, count } = await query;
  if (error) return serverError();

  return ok({
    data: projects,
    meta: { total: count ?? 0, page, limit },
  });
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data, error } = await parseBody(request, createProjectSchema);
  if (error) return err("Validation error", 400, error);

  const { data: project, error: dbError } = await supabaseAdmin
    .from("projects")
    .insert({ ...data, owner_id: authUser.sub })
    .select()
    .single();

  if (dbError) return serverError();

  return ok({ data: project, status: 201 });
}
