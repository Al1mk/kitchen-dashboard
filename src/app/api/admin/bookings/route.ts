import type { NextRequest } from "next/server";
import { jsonError, requireAdminApi } from "@/lib/auth/request.ts";
import { services } from "@/lib/server.ts";
import { addDays, berlinDateOf, berlinDayRange, isCalendarDate } from "@/lib/time/berlin.ts";

export async function GET(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? berlinDateOf(new Date());
  const days = Number(params.get("days") ?? "7");
  const roomId = params.get("roomId") ?? undefined;
  if (!isCalendarDate(from) || !Number.isInteger(days) || days < 1 || days > 62 || (roomId && roomId.length > 100)) {
    return jsonError(400, "validation", "Ungültige Filterwerte.");
  }
  return Response.json({ bookings: services().bookings.listAdmin(berlinDayRange(from).start, berlinDayRange(addDays(from, days - 1)).end, roomId) },
    { headers: { "Cache-Control": "no-store" } });
}
