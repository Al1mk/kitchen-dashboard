import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, roomError } from "@/lib/http/schedule-errors.ts";
import { services } from "@/lib/server.ts";

/** Makes an archived room active again. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/rooms/[id]/restore">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const result = services().rooms.restore((await ctx.params).id);
  if (!result.ok) return roomError(result.reason);
  return Response.json({ room: result.room }, { headers: noStore });
}
