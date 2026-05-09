import { ok } from "@/lib/response";

// GET /api/health — public health check endpoint
export async function GET() {
  return ok({
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
}
