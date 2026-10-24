import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { parseAnnouncementInput } from "@/lib/announcements/schema.ts";
import { services } from "@/lib/server.ts";

const noStore = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;
  return Response.json({ announcements: services().announcements.list() }, { headers: noStore });
}

export async function POST(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const body = (await readJson(request)) as { requestId?: unknown } | undefined;
  const parsed = parseAnnouncementInput(body);
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const requestId =
    typeof body?.requestId === "string" && body.requestId.length > 0 && body.requestId.length <= 100
      ? body.requestId
      : undefined;
  const announcement = services().announcements.create(parsed.content, requestId);
  return Response.json({ announcement }, { status: 201, headers: noStore });
}
