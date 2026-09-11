import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { databaseError, PortfolioError } from "./portfolio-api";
import { uuid } from "./portfolio-validation";
export async function mediaRedirect(db: SupabaseClient, id: string) {
  const { data: asset, error } = await db.from("project_assets").select("object_path").eq("id", uuid(id)).maybeSingle();
  databaseError(error); if (!asset) throw new PortfolioError(404, "NOT_FOUND");
  const { data, error: signedError } = await db.storage.from("portfolio").createSignedUrl(asset.object_path, 60);
  if (signedError || !data) throw new PortfolioError(404, "NOT_FOUND");
  return new Response(null, { status: 307, headers: { Location: data.signedUrl, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
