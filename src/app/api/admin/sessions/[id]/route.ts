import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, sessionError } from "@/lib/http/schedule-errors.ts";
import { services } from "@/lib/server.ts";
import { parseSessionInput } from "@/lib/sessions/schema.ts";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/sessions/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const session = services().classSessions.get((await ctx.params).id);
  if (!session) return sessionError({ reason: "not_found" });
  return Response.json({ session }, { headers: noStore });
}

/** Saves the session; public at once. */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/sessions/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const parsed = parseSessionInput(await readJson(request));
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const result = services().classSessions.update((await ctx.params).id, parsed.content);
  if (!result.ok) return sessionError(result);
  return Response.json({ session: result.session }, { headers: noStore });
}
