// Only public configuration belongs here: this module is shared with the browser.
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !key.startsWith("sb_publishable_")) {
    throw new Error("Supabase requires its project URL and publishable key.");
  }
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
      parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("Supabase requires an HTTPS project origin.");
  }
  return { url: parsed.origin, key };
}
