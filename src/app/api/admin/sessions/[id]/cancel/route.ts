import type { NextRequest } from "next/server";
import { requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, sessionError } from "@/lib/http/schedule-errors.ts";
import { services } from "@/lib/server.ts";

/** Cancels the session. It stays in the public schedule, marked as cancelled. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/admin/sessions/[id]/cancel">) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const result = services().classSessions.cancel((await ctx.params).id);
  if (!result.ok) return sessionError(result);
  return Response.json({ session: result.session }, { headers: noStore });
}
