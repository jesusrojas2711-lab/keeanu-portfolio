import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import { ASSET_FIELDS, PROJECT_FIELDS, type Asset, type Project } from "./portfolio-types";
export async function publicProjects() {
  let data: unknown[] | null = null;
  let error: unknown = null;
  try {
    const db = createPublicClient();
    const result = await db.from("projects").select(PROJECT_FIELDS).eq("status", "published").order("sort_order").order("created_at", { ascending: false }).limit(100);
    if (result.error) throw result.error;
    const projects = result.data ?? [];
    const assets = projects.length ? await db.from("project_assets").select(ASSET_FIELDS).in("project_id", projects.map((p) => p.id)).order("sort_order") : { data: [], error: null };
    if (assets.error) throw assets.error;
    data = projects.map((project) => ({ ...project, project_assets: (assets.data ?? []).filter((asset) => asset.project_id === project.id) }));
  } catch (caught) {
    error = caught;
  }
  // Keep the public landing page available even when the optional portfolio
  // database is temporarily unavailable (for example during a first deploy).
  // The admin can still repair the connection while the page shows its
  // editorial content and contact flow.
  if (error) {
    console.error("Portfolio query failed", error);
    return [];
  }
  return (data ?? []).map((row: any) => ({ ...row, assets: [...(row.project_assets ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)) })) as (Project & { assets: Asset[] })[];
}
