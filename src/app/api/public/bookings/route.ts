import type { NextRequest } from "next/server";
import { jsonError, readJson } from "@/lib/auth/request.ts";
import { bookingError, bookingUnavailable } from "@/lib/bookings/http.ts";
import { parseBookingInput } from "@/lib/bookings/policy.ts";
import { isSameOrigin } from "@/lib/http/origin.ts";
import { services } from "@/lib/server.ts";

export async function POST(request: NextRequest) {
  // No admin login: anonymous demo kiosk; but do reject cross-site POSTs.
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin", "Fremde Herkunft abgelehnt.");
  const parsed = parseBookingInput(await readJson(request));
  if (!parsed.ok) return bookingError("validation", parsed.message);
  try {
    const result = services().bookings.create(parsed.content);
    if (!result.ok) return bookingError(result.reason, result.message);
    // Cancellation secret is *never* returned by the server; the client generated it.
    return Response.json({ booking: result.booking, replayed: result.replayed }, {
      status: result.replayed ? 200 : 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) { return bookingUnavailable(err); }
}
