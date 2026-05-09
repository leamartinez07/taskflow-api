import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractBearerToken } from "@/lib/auth";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/api/health",
  "/api/auth/register",
  "/api/auth/login",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes and non-API routes
  const isPublic = PUBLIC_ROUTES.some((route) => pathname === route);
  const isApiRoute = pathname.startsWith("/api/");

  if (!isApiRoute || isPublic) return NextResponse.next();

  // Check for OPTIONS preflight (CORS)
  if (request.method === "OPTIONS") return NextResponse.next();

  // Verify JWT
  const token = extractBearerToken(request.headers.get("authorization"));
  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — missing token" },
      { status: 401 }
    );
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { success: false, error: "Unauthorized — invalid or expired token" },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
