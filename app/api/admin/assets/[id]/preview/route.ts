import { adminClient, failure } from "@/app/_lib/portfolio-api";
import { mediaRedirect } from "@/app/_lib/media";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { await adminClient(); return await mediaRedirect((await params).id); }
  catch (error) { return failure(error); }
}
