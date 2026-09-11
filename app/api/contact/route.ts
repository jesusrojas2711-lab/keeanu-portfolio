import { createHmac } from "node:crypto";
import { contactInput } from "@/app/_lib/contact-validation";
import { checkOrigin, readJson, RequestError, jsonError } from "@/app/_lib/http";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function fingerprint(value: string) {
  const secret = process.env.CONTACT_RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32) throw new Error("Contact rate-limit secret is unavailable.");
  return createHmac("sha256", secret).update(value).digest("hex");
}

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "local";
}

export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const input = contactInput(await readJson(request));

    // A filled honeypot receives the same success response so automated senders
    // do not learn which field caused the message to be discarded.
    if (input.website) {
      return Response.json({ accepted: true }, { headers: { "Cache-Control": "no-store" } });
    }

    const elapsed = Date.now() - input.startedAt;
    if (elapsed < 3000 || elapsed > 2 * 60 * 60 * 1000) throw new RequestError(400);

    const supabase = createAdminClient();
    const message = `Fecha del evento: ${input.eventDate}\nCelular: ${input.phone}\n\nLo que quieren recordar:\n${input.message}`;
    const { error } = await supabase.rpc("submit_contact", {
      p_name: input.name,
      p_email: input.email,
      p_message: message,
      p_ip_hash: fingerprint(clientAddress(request)),
      p_email_hash: fingerprint(input.email),
    });

    if (error?.message.includes("CONTACT_RATE_LIMIT")) return jsonError(429, "RATE_LIMITED");
    if (error) return jsonError(503, "CONTACT_UNAVAILABLE");
    return Response.json({ accepted: true }, { status: 201, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    return jsonError(error instanceof RequestError ? error.status : 503, error instanceof RequestError ? "INVALID_REQUEST" : "CONTACT_UNAVAILABLE");
  }
}
