export type Category = "weddings" | "films" | "commercial";
export type Project = { id: string; slug: string; title: string; category: Category; description: string; status: "draft" | "published"; sort_order: number; created_at: string; updated_at: string };
export type Asset = { id: string; project_id: string; object_path: string; alt_text: string; sort_order: number };
export type ProjectDetail = Project & { assets: Asset[] };
export const PROJECT_FIELDS = "id,slug,title,category,description,status,sort_order,created_at,updated_at";
export const ASSET_FIELDS = "id,project_id,object_path,alt_text,sort_order";
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
