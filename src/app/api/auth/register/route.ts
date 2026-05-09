import { hash } from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { ok, err, serverError, parseBody } from "@/lib/response";

// POST /api/auth/register
export async function POST(request: Request) {
  // 1. Validate body
  const { data, error } = await parseBody(request, registerSchema);
  if (error) return err("Validation error", 400, error);

  // 2. Check if email already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", data.email)
    .single();

  if (existing) return err("Email already registered", 409);

  // 3. Hash password
  const hashedPassword = await hash(data.password, 12);

  // 4. Insert user
  const { data: user, error: dbError } = await supabaseAdmin
    .from("users")
    .insert({ name: data.name, email: data.email, password: hashedPassword })
    .select("id, name, email, avatar_url, created_at")
    .single();

  if (dbError) {
    console.error("[register]", dbError);
    return serverError();
  }

  // 5. Sign JWT
  const token = await signToken({ sub: user.id, email: user.email, name: user.name });

  return ok({ data: { user, token }, status: 201 });
}
