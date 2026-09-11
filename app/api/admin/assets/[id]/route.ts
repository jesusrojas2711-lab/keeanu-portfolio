import { checkOrigin, readJson, RequestError } from "@/app/_lib/http";
import { adminClient, databaseError, failure, ok, PortfolioError } from "@/app/_lib/portfolio-api";
import { record, text, uuid } from "@/app/_lib/portfolio-validation";
import { ASSET_FIELDS } from "@/app/_lib/portfolio-types";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    checkOrigin(request);
    const db = await adminClient();
    const id = uuid((await params).id);
    const input = record(await readJson(request));
    if (Object.keys(input).some((key) => !["alt_text", "sort_order"].includes(key))) throw new RequestError(400);

    const { data: asset, error } = await db.from("project_assets").select("project_id").eq("id", id).maybeSingle();
    databaseError(error);
    if (!asset) throw new PortfolioError(404, "NOT_FOUND");
    const { data: project, error: projectError } = await db.from("projects").select("status").eq("id", asset.project_id).maybeSingle();
    databaseError(projectError);
    if (!project) throw new PortfolioError(404, "NOT_FOUND");

    const values: { alt_text?: string; sort_order?: number } = {};
    if ("alt_text" in input) values.alt_text = text(input.alt_text, 0, 500);
    if ("sort_order" in input) {
      if (typeof input.sort_order !== "number" || !Number.isInteger(input.sort_order) || input.sort_order < 0 || input.sort_order > 10000) throw new RequestError(400);
      values.sort_order = input.sort_order;
    }
    if (!Object.keys(values).length) throw new RequestError(400);
    const { data, error: updateError } = await db.from("project_assets").update(values).eq("id", id).select(ASSET_FIELDS).single();
    databaseError(updateError);
    return ok({ asset: data });
  } catch (error) { return failure(error); }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    checkOrigin(request); const db = await adminClient(); const id = uuid((await params).id);
    const { data: asset, error } = await db.from("project_assets").select("object_path,project_id").eq("id", id).maybeSingle();
    databaseError(error); if (!asset) return ok({ removed: true });
    const { data: project, error: projectError } = await db.from("projects").select("status").eq("id", asset.project_id).maybeSingle();
    databaseError(projectError); if (!project || project.status !== "draft") throw new PortfolioError(409, "UNPUBLISH_FIRST");
    const { error: storageError } = await db.storage.from("portfolio").remove([asset.object_path]);
    if (storageError) throw new PortfolioError(503, "REMOVE_FAILED");
    const { error: deleteError } = await db.from("project_assets").delete().eq("id", id);
    databaseError(deleteError);
    return ok({ removed: true });
  } catch (error) { return failure(error); }
}
