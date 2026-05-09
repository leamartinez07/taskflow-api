import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ── Admin client (server-only, uses service role key) ────────────────────────
// Bypasses Row Level Security. Use ONLY in API routes, never in the browser.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Public client (safe for browser) ────────────────────────────────────────
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
