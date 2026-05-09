import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: project } = await supabaseAdmin
    .from("projects").select("id").eq("id", id).single();
  if (!project) return notFound("Project not found");

  const { data: tasks, error } = await supabaseAdmin
    .from("tasks")
    .select("*, creator:users!created_by(id, name), assignee:users!assigned_to(id, name)")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  if (error) return serverError();
  return ok({ data: tasks ?? [] });
}
