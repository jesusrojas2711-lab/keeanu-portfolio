import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

// Use the default in Server Components. Session renewal is handled by proxy.ts.
// Pass { writableCookies: true } only in Server Actions or Route Handlers;
// cookie-writing failures there must propagate instead of being silently ignored.
export async function createClient({ writableCookies = false } = {}) {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseConfig();
  return createServerClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        if (!writableCookies) return;
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
