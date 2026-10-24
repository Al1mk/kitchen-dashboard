import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { parseAnnouncementInput } from "@/lib/announcements/schema.ts";
import { services } from "@/lib/server.ts";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/announcements/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const announcement = services().announcements.get((await ctx.params).id);
  if (!announcement) return jsonError(404, "not_found", "Mitteilung nicht gefunden.");
  return Response.json({ announcement }, { headers: noStore });
}

/** Saves the draft. Does not change what the public display shows. */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/announcements/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const parsed = parseAnnouncementInput(await readJson(request));
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const announcement = services().announcements.saveDraft((await ctx.params).id, parsed.content);
  if (!announcement) return jsonError(404, "not_found", "Mitteilung nicht gefunden.");
  return Response.json({ announcement }, { headers: noStore });
}
