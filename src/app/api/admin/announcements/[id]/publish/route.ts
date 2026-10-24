import type { NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";

/** Publishes the currently saved draft. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/announcements/[id]/publish">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const result = services().announcements.publish((await ctx.params).id);
  if (!result.ok) {
    return result.reason === "not_found"
      ? jsonError(404, "not_found", "Mitteilung nicht gefunden.")
      : jsonError(409, "expired", "„Sichtbar bis“ liegt in der Vergangenheit. Bitte Zeitraum anpassen und speichern.");
  }
  return Response.json({ announcement: result.announcement }, { headers: { "Cache-Control": "no-store" } });
}
