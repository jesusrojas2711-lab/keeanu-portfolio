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
  }
  const rows = data ?? [];
  const fallback = [
    ['29748b97-0084-4b91-bea6-f9195b651e4b', 'sheccid-y-alejandro', 'Sheccid & Alejandro', 'f56e75ff-0e3b-4cdd-8047-5d5392bc7a25'],
    ['cd4c5b2f-d4b1-47ac-bc53-3ff80548404b', 'ana-y-adrian', 'Ana & Adrian', '8e8c94ef-c393-44d9-b436-bb51ac5afda7'],
    ['592c970f-7bdc-43ec-8fcd-9bd0b749a1a3', 'arisia-y-jaziel', 'Arisia & Jaziel', '2bb49081-9cea-48b3-9deb-95c6abb83862'],
    ['d498d424-ed0f-4afb-a20b-8f6d0cd18df7', 'l-y-a', 'L & A', '7f4df97f-89d3-4944-b103-919e6bba1fb9'],
  ];
  if (!rows.length) return fallback.map(([id, slug, title, assetId], index) => ({ id, slug, title, category: 'weddings', description: '', status: 'published', sort_order: index, created_at: '', updated_at: '', assets: [{ id: assetId, project_id: id, object_path: '', alt_text: title, sort_order: 0 }] })) as (Project & { assets: Asset[] })[];
  return rows.map((row) => {
    const project = row as Project & { project_assets?: Asset[] };
    return { ...project, assets: [...(project.project_assets ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id)) };
  }) as (Project & { assets: Asset[] })[];
}
