import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key || !key.startsWith("sb_secret_")) {
    throw new Error("A server-only Supabase secret key is required.");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}

