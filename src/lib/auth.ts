import { SignJWT, jwtVerify } from "jose";
import type { JwtPayload } from "@/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-min-32-chars!!");

// ── Sign a new JWT ────────────────────────────────────────────────────────────
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN ?? "7d")
    .sign(secret);
}

// ── Verify & decode a JWT ─────────────────────────────────────────────────────
export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}

// ── Extract Bearer token from Authorization header ───────────────────────────
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

// ── Get authenticated user from request ──────────────────────────────────────
export async function getAuthUser(request: Request): Promise<JwtPayload | null> {
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}
