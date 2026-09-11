import "server-only";
import { AdminAccessError, requireAdmin } from "./auth";
import { RequestError, jsonError } from "./http";
import { createClient } from "@/lib/supabase/server";
export class PortfolioError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); }
}
export function ok(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
export function failure(error: unknown) {
  if (error instanceof AdminAccessError) return jsonError(error.status, "ACCESS_DENIED");
  if (error instanceof RequestError) return jsonError(error.status, "INVALID_REQUEST");
  if (error instanceof PortfolioError) return jsonError(error.status, error.code);
  return jsonError(503, "SERVICE_UNAVAILABLE");
}
export async function adminClient() {
  await requireAdmin();
  return createClient({ writableCookies: true });
}
export function databaseError(error: { code?: string } | null) {
  if (!error) return;
  if (error.code === "23505") throw new PortfolioError(409, "SLUG_IN_USE");
  if (error.code === "23514" || error.code === "23503") throw new RequestError(400);
  throw new PortfolioError(503, "SERVICE_UNAVAILABLE");
}
