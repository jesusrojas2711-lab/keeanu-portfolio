import { checkOrigin, readJson } from "@/app/_lib/http";
import { adminClient, databaseError, failure, ok } from "@/app/_lib/portfolio-api";
import { projectInput } from "@/app/_lib/portfolio-validation";
import { PROJECT_FIELDS } from "@/app/_lib/portfolio-types";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const db = await adminClient();
    const raw = new URL(request.url).searchParams.get("page") ?? "1";
    const page = /^\d{1,5}$/.test(raw) ? Math.max(1, Number(raw)) : 1;
    const pageSize = 12;
    const { data, error, count } = await db.from("projects").select(PROJECT_FIELDS, { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * pageSize, page * pageSize - 1);
    databaseError(error);
    return ok({ projects: data, count, page, pageSize });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const db = await adminClient();
    const input = projectInput(await readJson(request));
    const { data, error } = await db.from("projects").insert({ ...input, status: "draft" }).select(PROJECT_FIELDS).single();
    databaseError(error);
    return ok({ project: data }, 201);
  } catch (error) { return failure(error); }
}
