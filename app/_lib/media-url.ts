const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wqldecfbovawesodvros.supabase.co";

export function publicMediaUrl(objectPath: string, fallbackId?: string) {
  if (!objectPath && fallbackId) return `/media/${fallbackId}`;
  return `${supabaseOrigin.replace(/\/$/, "")}/storage/v1/object/public/portfolio/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}
