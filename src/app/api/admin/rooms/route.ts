import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, roomError } from "@/lib/http/schedule-errors.ts";
import { parseRoomInput } from "@/lib/rooms/schema.ts";
import { services } from "@/lib/server.ts";

export async function GET(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const includeArchived = request.nextUrl.searchParams.get("includeArchived") === "1";
  return Response.json({ rooms: services().rooms.list({ includeArchived }) }, { headers: noStore });
}

/** Creates a room. It appears in the public directory immediately. */
export async function POST(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const parsed = parseRoomInput(await readJson(request));
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const result = services().rooms.create(parsed.content);
  if (!result.ok) return roomError(result.reason);
  return Response.json({ room: result.room }, { status: 201, headers: noStore });
}
