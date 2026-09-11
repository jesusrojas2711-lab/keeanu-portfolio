import { RequestError } from "./http";
export function uuid(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new RequestError(400);
  return value.toLowerCase();
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestError(400);
  return value as Record<string, unknown>;
}
export function text(value: unknown, min: number, max: number) {
  if (typeof value !== "string" || value.trim().length < min || value.length > max) throw new RequestError(400);
  return value.trim();
}
export function projectInput(value: unknown) {
  const data = record(value);
  if (Object.keys(data).some(k => !["title", "slug", "category", "description", "sort_order"].includes(k))) throw new RequestError(400);
  const title = text(data.title, 1, 160);
  const slug = text(data.slug, 1, 120);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new RequestError(400);
  const category = data.category;
  if (category !== "weddings" && category !== "films" && category !== "commercial") throw new RequestError(400);
  const description = text(data.description ?? "", 0, 3000);
  const sort_order = data.sort_order ?? 0;
  if (typeof sort_order !== "number" || !Number.isInteger(sort_order) || sort_order < 0 || sort_order > 10000) throw new RequestError(400);
  return { title, slug, category, description, sort_order };
}
