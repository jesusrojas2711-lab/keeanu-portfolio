import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { ASSET_FIELDS, PROJECT_FIELDS, type Asset, type Project } from "./portfolio-types";
export async function publicProjects() {
  const db = createPublicClient();
  const { data, error } = await db.from("projects").select(`${PROJECT_FIELDS},project_assets(${ASSET_FIELDS})`).eq("status", "published").order("sort_order").order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error("Portfolio unavailable");
  return (data ?? []).map(row => ({ ...row, assets: [...row.project_assets].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)) })) as (Project & { assets: Asset[] })[];
}
