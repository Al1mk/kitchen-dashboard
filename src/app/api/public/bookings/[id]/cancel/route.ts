import type { NextRequest } from "next/server";
import { jsonError } from "@/lib/auth/request.ts";
import { bookingError, bookingUnavailable } from "@/lib/bookings/http.ts";
import { validRandomToken } from "@/lib/bookings/policy.ts";
import { isSameOrigin } from "@/lib/http/origin.ts";
import { services } from "@/lib/server.ts";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/public/bookings/[id]/cancel">) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin", "Fremde Herkunft abgelehnt.");
  const bearer = request.headers.get("authorization") ?? "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!validRandomToken(token, 32)) return jsonError(401, "unauthorized", "Stornierungscode fehlt oder ist ungültig.");
  const id = (await ctx.params).id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return bookingError("not_found");
  try {
    const result = services().bookings.cancel(id, token);
    if (!result.ok) return bookingError(result.reason);
    return Response.json({ booking: result.booking }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) { return bookingUnavailable(err); }
}
