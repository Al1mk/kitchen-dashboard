import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, roomError } from "@/lib/http/schedule-errors.ts";
import { services } from "@/lib/server.ts";

/** Hides the room from the directory and new sessions; refused while sessions are still planned. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/rooms/[id]/archive">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const result = services().rooms.archive((await ctx.params).id);
  if (!result.ok) return roomError(result.reason, "upcomingSessions" in result ? result.upcomingSessions : 0);
  return Response.json({ room: result.room }, { headers: noStore });
}
