import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError } from "@/types";

type SuccessOptions<T> = {
  data: T;
  status?: number;
  meta?: ApiSuccess<T>["meta"];
};

// ── Success response ──────────────────────────────────────────────────────────
export function ok<T>({ data, status = 200, meta }: SuccessOptions<T>) {
  const body: ApiSuccess<T> = { success: true, data, ...(meta && { meta }) };
  return NextResponse.json(body, { status });
}

// ── Error responses ───────────────────────────────────────────────────────────
export function err(error: string, status = 400, details?: unknown) {
  const body: ApiError = { success: false, error, ...(details && { details }) };
  return NextResponse.json(body, { status });
}

export const unauthorized = (msg = "Unauthorized") => err(msg, 401);
export const forbidden = (msg = "Forbidden") => err(msg, 403);
export const notFound = (msg = "Not found") => err(msg, 404);
export const serverError = (msg = "Internal server error") => err(msg, 500);

// ── Zod validation helper ─────────────────────────────────────────────────────
import { ZodSchema } from "zod";

export async function parseBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { data: null, error: result.error.flatten() };
    }
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: { message: "Invalid JSON body" } };
  }
}
