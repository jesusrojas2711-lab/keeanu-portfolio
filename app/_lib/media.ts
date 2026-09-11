import "server-only";
import { PortfolioError } from "./portfolio-api";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { uuid } from "./portfolio-validation";
export async function mediaRedirect(id: string) {
  const assetId = uuid(id);
  const { url, key } = getSupabaseConfig();
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const assetsUrl = new URL(`${url}/rest/v1/project_assets`);
  assetsUrl.searchParams.set("select", "object_path");
  assetsUrl.searchParams.set("id", `eq.${assetId}`);
  assetsUrl.searchParams.set("limit", "1");
  const assetResponse = await fetch(assetsUrl, { headers, cache: "no-store" });
  if (!assetResponse.ok) throw new PortfolioError(503, "SERVICE_UNAVAILABLE");
  const assets = (await assetResponse.json()) as Array<{ object_path?: string }>;
  const objectPath = assets[0]?.object_path;
  if (!objectPath) throw new PortfolioError(404, "NOT_FOUND");

  const location = `${url}/storage/v1/object/public/portfolio/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
  return new Response(null, { status: 307, headers: { Location: location, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
