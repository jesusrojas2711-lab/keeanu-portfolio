import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
export async function proxy(request: NextRequest) { return updateSession(request); }
export const config = {
  // Add other session-aware routes here when they are introduced.
  // Keep the public portfolio independent of authentication availability.
  matcher: ["/admin/:path*", "/login", "/auth/:path*", "/api/admin/:path*"],
};
