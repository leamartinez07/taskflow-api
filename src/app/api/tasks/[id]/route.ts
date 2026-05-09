import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { updateTaskSchema } from "@/lib/schemas";
import { ok, err, unauthorized, forbidden, notFound, serverError, parseBody } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: task, error } = await supabaseAdmin
    .from("tasks")
    .select("*, project:projects(id, name), comments(id, content, created_at, user:users(id, name))")
    .eq("id", id).single();

  if (error || !task) return notFound("Task not found");
  return ok({ data: task });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: task } = await supabaseAdmin
    .from("tasks").select("id, created_by, assigned_to").eq("id", id).single();

  if (!task) return notFound("Task not found");
  if (task.created_by !== authUser.sub && task.assigned_to !== authUser.sub)
    return forbidden("Only the task creator or assignee can update this task");

  const { data, error: validErr } = await parseBody(request, updateTaskSchema);
  if (validErr) return err("Validation error", 400, validErr);

  const { data: updated, error: dbErr } = await supabaseAdmin
    .from("tasks")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();

  if (dbErr) return serverError();
  return ok({ data: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: task } = await supabaseAdmin
    .from("tasks").select("id, created_by").eq("id", id).single();

  if (!task) return notFound("Task not found");
  if (task.created_by !== authUser.sub)
    return forbidden("Only the task creator can delete this task");

  const { error } = await supabaseAdmin.from("tasks").delete().eq("id", id);
  if (error) return serverError();
  return ok({ data: { message: "Task deleted successfully" } });
}
