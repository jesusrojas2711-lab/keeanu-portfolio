import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key?.startsWith("sb_publishable_")) throw new Error("Missing public Supabase configuration.");
const origin = new URL(url);
if (origin.protocol !== "https:") throw new Error("Expected HTTPS.");
// Read only: verifies the project's public Auth endpoint and API key.
// Does not create users, send email, access records, or print credentials.
try {
  const response = await fetch(new URL("/auth/v1/settings", origin), {
    headers: { apikey: key }, signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Supabase returned HTTP ${response.status}.`);
  const settings = await response.json();
  if (typeof settings.disable_signup !== "boolean") throw new Error("Unexpected Auth response.");
  console.log("Supabase URL and publishable key verified.");
  console.log(`Public signup: ${settings.disable_signup ? "disabled" : "enabled"}.`);
  console.log("Database policies, admin access and storage have not been verified.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Supabase check failed.");
  process.exitCode = 1;
}
