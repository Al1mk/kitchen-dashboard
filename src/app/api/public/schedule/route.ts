import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { berlinDateOf, isCalendarDate } from "@/lib/time/berlin.ts";

// Public, read-only. Sessions of one Europe/Berlin calendar day (default: today
// by the server clock), cancelled ones included. Optional roomId filter; the
// room must be active. Allowlisted fields only (see docs/contracts.md).
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const now = new Date();
  const date = params.get("date") ?? berlinDateOf(now);
  if (!isCalendarDate(date)) return jsonError(400, "validation", "Ungültiges Datum (erwartet: JJJJ-MM-TT).");

  const roomId = params.get("roomId") ?? undefined;
  let room = null;
  if (roomId) {
    room = services().rooms.listPublic().find((r) => r.id === roomId) ?? null;
    if (!room) return jsonError(404, "not_found", "Raum nicht gefunden.");
  }
  return Response.json(
    { serverTime: now.toISOString(), date, room, sessions: services().classSessions.listPublicDay(date, roomId) },
    { headers },
  );
}
