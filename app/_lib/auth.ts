import "server-only";
import { createClient } from "@/lib/supabase/server";

export class AdminAccessError extends Error {
  readonly status: 401 | 403 | 503;
  constructor(status: 401 | 403 | 503) {
    super("Admin access unavailable");
    this.status = status;
  }
}

// Verify on every protected operation. Do not trust user_metadata, a supplied UID,
// or getSession(). The database checks the current user's role under RLS.
export async function requireAdmin() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw new AdminAccessError(error.status && error.status >= 500 || error.name === "AuthRetryableFetchError" ? 503 : 401);
    }
    if (!data.user || data.user.is_anonymous) throw new AdminAccessError(401);
    const { data: permission, error: permissionError } = await supabase
      .from("portfolio_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (permissionError) throw new AdminAccessError(503);
    if (!permission || permission.user_id !== data.user.id) throw new AdminAccessError(403);
    return { id: data.user.id };
  } catch (error) {
    if (error instanceof AdminAccessError) throw error;
    // Do not disclose database details, raw tokens, or provider errors.
    throw new AdminAccessError(503);
  }
}
