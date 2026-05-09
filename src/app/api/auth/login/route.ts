import { compare } from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";
import { ok, err, serverError, parseBody } from "@/lib/response";

// POST /api/auth/login
export async function POST(request: Request) {
  // 1. Validate body
  const { data, error } = await parseBody(request, loginSchema);
  if (error) return err("Validation error", 400, error);

  // 2. Find user by email (include password for comparison)
  const { data: user, error: dbError } = await supabaseAdmin
    .from("users")
    .select("id, name, email, password, avatar_url, created_at")
    .eq("email", data.email)
    .single();

  // Use the same generic message to avoid user enumeration attacks
  if (dbError || !user) return err("Invalid email or password", 401);

  // 3. Compare password
  const passwordMatch = await compare(data.password, user.password);
  if (!passwordMatch) return err("Invalid email or password", 401);

  // 4. Sign JWT (don't send password in response)
  const { password: _, ...safeUser } = user;
  const token = await signToken({ sub: user.id, email: user.email, name: user.name });

  if (dbError) {
    console.error("[login]", dbError);
    return serverError();
  }

  return ok({ data: { user: safeUser, token } });
}
