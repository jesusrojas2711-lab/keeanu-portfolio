import { RequestError } from "./http";

export type ContactInput = {
  name: string;
  email: string;
  eventDate: string;
  phone: string;
  message: string;
  website: string;
  startedAt: number;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function contactInput(value: unknown): ContactInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400);
  const input = value as Record<string, unknown>;
  const allowed = new Set(["name", "email", "eventDate", "phone", "message", "website", "startedAt"]);
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new RequestError(400);

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const eventDate = typeof input.eventDate === "string" ? input.eventDate.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const website = typeof input.website === "string" ? input.website.trim() : "";
  const startedAt = input.startedAt;

  if (
    name.length < 1 || name.length > 100 || controlCharacters.test(name) ||
    email.length > 254 || !emailPattern.test(email) || controlCharacters.test(email) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    phone.length < 7 || phone.length > 25 || !/^[0-9+()\s-]+$/.test(phone) ||
    message.length < 10 || message.length > 3000 || controlCharacters.test(message) ||
    website.length > 200 || typeof startedAt !== "number" || !Number.isSafeInteger(startedAt)
  ) throw new RequestError(400);

  return { name, email, eventDate, phone, message, website, startedAt };
}
