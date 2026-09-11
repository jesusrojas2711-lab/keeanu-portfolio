import { randomUUID } from "node:crypto";
import { checkOrigin, readBody, RequestError } from "@/app/_lib/http";
import { adminClient, databaseError, failure, ok, PortfolioError } from "@/app/_lib/portfolio-api";
import { uuid, text } from "@/app/_lib/portfolio-validation";
import { optimizePhoto } from "@/app/_lib/images";
import { MAX_UPLOAD_BYTES, ASSET_FIELDS } from "@/app/_lib/portfolio-types";
export const runtime = "nodejs";
export const maxDuration = 30;
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const db = await adminClient();
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("multipart/form-data;")) throw new RequestError(415);
    const bytes = await readBody(request, MAX_UPLOAD_BYTES + 16384);
    let form: FormData;
    try { form = await new Response(bytes, { headers: { "Content-Type": contentType } }).formData(); }
    catch { throw new RequestError(400); }
    const projectId = uuid(text(form.get("project_id"), 36, 36));
    const alt = text(form.get("alt_text") ?? "", 0, 500);
    const file = form.get("file");
    if (!(file instanceof File)) throw new RequestError(400);
    const { data: project, error } = await db.from("projects").select("status").eq("id", projectId).maybeSingle();
    databaseError(error); if (!project) throw new PortfolioError(404, "NOT_FOUND");
    if (project.status !== "draft") throw new PortfolioError(409, "UNPUBLISH_FIRST");
    const { count, error: countError } = await db.from("project_assets").select("id", { count: "exact", head: true }).eq("project_id", projectId);
    databaseError(countError); if ((count ?? 0) >= 200) throw new PortfolioError(409, "PHOTO_LIMIT");
    const optimized = await optimizePhoto(new Uint8Array(await file.arrayBuffer()));
    const path = `${projectId}/${randomUUID()}.webp`;
    const { error: uploadError } = await db.storage.from("portfolio").upload(path, optimized, { contentType: "image/webp", cacheControl: "60", upsert: false });
    if (uploadError) throw new PortfolioError(503, "UPLOAD_FAILED");
    const { data, error: assetError } = await db.from("project_assets").insert({ project_id: projectId, object_path: path, alt_text: alt, sort_order: Math.min(count ?? 0, 10000) }).select(ASSET_FIELDS).single();
    if (assetError) {
      const { error: cleanupError } = await db.storage.from("portfolio").remove([path]);
      if (cleanupError) throw new PortfolioError(503, "UPLOAD_CLEANUP_REQUIRED");
      throw new PortfolioError(503, "UPLOAD_FAILED");
    }
    return ok({ asset: data }, 201);
  } catch (error) { return failure(error); }
}
