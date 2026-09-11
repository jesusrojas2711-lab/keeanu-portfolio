import { checkOrigin, readJson, RequestError } from "@/app/_lib/http";
import { adminClient, databaseError, failure, ok, PortfolioError } from "@/app/_lib/portfolio-api";
import { projectInput, record, uuid } from "@/app/_lib/portfolio-validation";
import { PROJECT_FIELDS, ASSET_FIELDS } from "@/app/_lib/portfolio-types";
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    const db = await adminClient(); const id = uuid((await context.params).id);
    const { data: project, error } = await db.from("projects").select(PROJECT_FIELDS).eq("id", id).maybeSingle();
    databaseError(error); if (!project) throw new PortfolioError(404, "NOT_FOUND");
    const { data: assets, error: assetError } = await db.from("project_assets").select(ASSET_FIELDS).eq("project_id", id).order("sort_order").order("id").limit(200);
    databaseError(assetError);
    return ok({ project: { ...project, assets } });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: Request, context: Context) {
  try {
    checkOrigin(request);
    const db = await adminClient(); const id = uuid((await context.params).id);
    const input = record(await readJson(request));
    const { data: current, error } = await db.from("projects").select("status").eq("id", id).maybeSingle();
    databaseError(error); if (!current) throw new PortfolioError(404, "NOT_FOUND");
    let values;
    if (Object.keys(input).length === 1 && "status" in input) {
      if (input.status !== "draft" && input.status !== "published") throw new RequestError(400);
      if (input.status === "published") {
        const { count, error: photoError } = await db.from("project_assets").select("id", { count: "exact", head: true }).eq("project_id", id);
        databaseError(photoError);
        if (!count) throw new PortfolioError(409, "PHOTO_REQUIRED");
      }
      values = { status: input.status };
    } else {
      values = projectInput(input);
    }
    const { data, error: updateError } = await db.from("projects").update(values).eq("id", id).eq("status", current.status).select(PROJECT_FIELDS).maybeSingle();
    databaseError(updateError); if (!data) throw new PortfolioError(409, "PROJECT_CHANGED");
    return ok({ project: data });
  } catch (error) { return failure(error); }
}
