import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/schemas";
import { ok, err, unauthorized, forbidden, notFound, serverError, parseBody } from "@/lib/response";

type Params = { params: Promise<{ id: string }> };

async function getOwnedProject(id: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("projects").select("*").eq("id", id).single();
  if (error || !data) return { project: null, error: notFound("Project not found") };
  if (data.owner_id !== userId) return { project: null, error: forbidden() };
  return { project: data, error: null };
}

export async function GET(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select("*, owner:users(id, name, email, avatar_url), tasks(id, title, status, priority)")
    .eq("id", id).single();

  if (error || !project) return notFound("Project not found");
  return ok({ data: project });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { project, error: ownerErr } = await getOwnedProject(id, authUser.sub);
  if (ownerErr) return ownerErr;

  const { data, error: validErr } = await parseBody(request, updateProjectSchema);
  if (validErr) return err("Validation error", 400, validErr);

  const { data: updated, error: dbErr } = await supabaseAdmin
    .from("projects")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", project!.id).select().single();

  if (dbErr) return serverError();
  return ok({ data: updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { project, error: ownerErr } = await getOwnedProject(id, authUser.sub);
  if (ownerErr) return ownerErr;

  const { error: dbErr } = await supabaseAdmin.from("projects").delete().eq("id", project!.id);
  if (dbErr) return serverError();
  return ok({ data: { message: "Project deleted successfully" } });
}
