import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/request.ts";
import { bookingError, bookingUnavailable } from "@/lib/bookings/http.ts";
import { services } from "@/lib/server.ts";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/bookings/[id]/cancel">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  try {
    const result = services().bookings.cancelByAdmin((await ctx.params).id);
    if (!result.ok) return bookingError(result.reason);
    return Response.json({ booking: result.booking }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) { return bookingUnavailable(err); }
}
