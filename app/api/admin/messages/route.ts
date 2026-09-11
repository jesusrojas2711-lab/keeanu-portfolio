import { adminClient, databaseError, failure, ok } from "@/app/_lib/portfolio-api";
import { checkOrigin, readJson, RequestError } from "@/app/_lib/http";

const statuses = new Set(["new", "read", "archived"]);

export async function GET() {
  try {
    const supabase = await adminClient();
    const { data, error } = await supabase
      .from("contact_messages")
      .select("id,name,email,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    databaseError(error);
    return ok({ messages: data ?? [] });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request) {
  try {
    checkOrigin(request);
    const body = await readJson(request, 2048);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new RequestError(400);
    const { id, status } = body as Record<string, unknown>;
    if (Object.keys(body).some((key) => !["id", "status"].includes(key)) ||
      typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      typeof status !== "string" || !statuses.has(status)) throw new RequestError(400);
    const supabase = await adminClient();
    const { data, error } = await supabase.from("contact_messages").update({ status }).eq("id", id).select("id,status").maybeSingle();
    databaseError(error);
    if (!data) throw new RequestError(404);
    return ok({ message: data });
  } catch (error) { return failure(error); }
}

