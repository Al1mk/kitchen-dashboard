import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/auth/request.ts";
import { bookingError } from "@/lib/bookings/http.ts";
import { BOOKING_POLICY } from "@/lib/bookings/policy.ts";
import { services } from "@/lib/server.ts";
import { berlinDateOf } from "@/lib/time/berlin.ts";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId") ?? "";
  const date = request.nextUrl.searchParams.get("date") ?? berlinDateOf(new Date());
  if (!roomId || roomId.length > 100) return jsonError(400, "validation", "Bitte einen Raum wählen.", { detail: "invalid_input" });
  const result = services().bookings.availability(roomId, date);
  if (!result.ok) return bookingError(result.reason, result.reason === "validation" ? { detail: "date_out_of_range" } : {});
  return Response.json(
    { serverTime: new Date().toISOString(), date, timeZone: BOOKING_POLICY.timeZone, policy: BOOKING_POLICY,
      room: result.room, window: { startTime: BOOKING_POLICY.opens, endTime: BOOKING_POLICY.closes }, busy: result.busy, free: result.free },
    { headers: { "Cache-Control": "no-store" } },
  );
}
