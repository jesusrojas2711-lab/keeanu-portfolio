import "server-only";
export class RequestError extends Error {
  constructor(public status: number) { super("Invalid request"); }
}
export function jsonError(status: number, code: string) {
  return Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export function checkOrigin(request: Request) {
  const configured = process.env.SITE_URL;
  const allowed = configured ? new URL(configured).origin : process.env.NODE_ENV !== "production" ? "http://localhost:3000" : null;
  if (!allowed) throw new RequestError(503);
  if (request.headers.get("origin") !== allowed) throw new RequestError(403);
}
export async function readJson(request: Request, limit = 16384): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new RequestError(415);
  const bytes = await readBody(request, limit);
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new RequestError(400); }
}
export async function readBody(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  if (!request.body) throw new RequestError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RequestError(413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
