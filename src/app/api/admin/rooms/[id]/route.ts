import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, roomError } from "@/lib/http/schedule-errors.ts";
import { parseRoomInput } from "@/lib/rooms/schema.ts";
import { services } from "@/lib/server.ts";

export async function GET(request: NextRequest, ctx: RouteContext<"/api/admin/rooms/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const room = services().rooms.get((await ctx.params).id);
  if (!room) return roomError("not_found");
  return Response.json({ room }, { headers: noStore });
}

/** Saves room data; public at once. Sessions keep their reference (stable id). */
export async function PUT(request: NextRequest, ctx: RouteContext<"/api/admin/rooms/[id]">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const parsed = parseRoomInput(await readJson(request));
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const result = services().rooms.update((await ctx.params).id, parsed.content);
  if (!result.ok) return roomError(result.reason);
  return Response.json({ room: result.room }, { headers: noStore });
}
