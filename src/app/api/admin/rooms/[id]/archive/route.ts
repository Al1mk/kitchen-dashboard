import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, roomError } from "@/lib/http/schedule-errors.ts";
import { busyResponse } from "@/lib/http/busy.ts";
import { services } from "@/lib/server.ts";

/** Hides the room from the directory and new sessions; refused while sessions are still planned. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/rooms/[id]/archive">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  let result;
  try {
    result = services().rooms.archive((await ctx.params).id);
  } catch (error) {
    return busyResponse(error); // retryable 503 on lock contention
  }
  if (!result.ok) {
    return roomError(result.reason, result.reason === "in_use" ? { sessions: result.upcomingSessions, bookings: result.upcomingBookings } : undefined);
  }
  return Response.json({ room: result.room }, { headers: noStore });
}
