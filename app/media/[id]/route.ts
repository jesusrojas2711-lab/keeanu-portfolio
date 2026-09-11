import { mediaRedirect } from "@/app/_lib/media";
import { failure } from "@/app/_lib/portfolio-api";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { return await mediaRedirect((await params).id); }
  catch (error) { return failure(error); }
}
