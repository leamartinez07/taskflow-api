import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/response";

// GET /api/auth/me — returns the authenticated user's profile
export async function GET(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, avatar_url, created_at, updated_at")
    .eq("id", authUser.sub)
    .single();

  if (error) return serverError();
  if (!user) return notFound("User not found");

  return ok({ data: user });
}

// PATCH /api/auth/me — update name or avatar
export async function PATCH(request: Request) {
  const authUser = await getAuthUser(request);
  if (!authUser) return unauthorized();

  let body: { name?: string; avatar_url?: string };
  try {
    body = await request.json();
  } catch {
    return ok({ data: null, status: 400 });
  }

  const updates: Record<string, string> = {};
  if (body.name) updates.name = body.name;
  if (body.avatar_url) updates.avatar_url = body.avatar_url;

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", authUser.sub)
    .select("id, name, email, avatar_url, created_at, updated_at")
    .single();

  if (error) return serverError();

  return ok({ data: user });
}
