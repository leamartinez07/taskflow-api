import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { createCommentSchema } from "@/lib/schemas";
import { ok, err, unauthorized, notFound, serverError, parseBody } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: task } = await supabaseAdmin
    .from("tasks").select("id").eq("id", id).single();
  if (!task) return notFound("Task not found");

  const { data: comments, error } = await supabaseAdmin
    .from("comments")
    .select("*, user:users(id, name)")
    .eq("task_id", id)
    .order("created_at", { ascending: true });

  if (error) return serverError();
  return ok({ data: comments ?? [] });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: task } = await supabaseAdmin
    .from("tasks").select("id").eq("id", id).single();
  if (!task) return notFound("Task not found");

  const { data, error: validErr } = await parseBody(request, createCommentSchema);
  if (validErr) return err("Validation error", 400, validErr);

  const { data: comment, error: dbErr } = await supabaseAdmin
    .from("comments")
    .insert({ content: data.content, task_id: id, user_id: authUser.sub })
    .select("*, user:users(id, name)")
    .single();

  if (dbErr) return serverError();
  return ok({ data: comment, status: 201 });
}
