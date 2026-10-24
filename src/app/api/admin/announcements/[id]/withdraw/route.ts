import type { NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

/** Removes the announcement from the public display; content stays as draft. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/announcements/[id]/withdraw">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const result = services().announcements.withdraw((await ctx.params).id);
  if (!result.ok) {
    return result.reason === "not_found"
      ? jsonError(404, "not_found", "Mitteilung nicht gefunden.")
      : jsonError(409, "not_published", "Diese Mitteilung ist derzeit nicht veröffentlicht.");
  }
  return Response.json({ announcement: result.announcement }, { headers: { "Cache-Control": "no-store" } });
}
