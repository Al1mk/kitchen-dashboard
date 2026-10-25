import type { NextRequest } from "next/server";
import { jsonError, readJson, requireAdminApi } from "@/lib/auth/request.ts";
import { noStore, sessionError } from "@/lib/http/schedule-errors.ts";
import { services } from "@/lib/server.ts";
import { parseSessionInput } from "@/lib/sessions/schema.ts";
import { addDays, berlinDateOf, berlinDayRange, isCalendarDate } from "@/lib/time/berlin.ts";

/** Sessions of `days` Berlin calendar days from `from` (default: today, 7 days), optionally for one room. */
export async function GET(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? berlinDateOf(new Date());
  const days = Number(params.get("days") ?? 7);
  if (!isCalendarDate(from) || !Number.isInteger(days) || days < 1 || days > 62) {
    return jsonError(400, "validation", "Ungültiger Zeitraum (from=JJJJ-MM-TT, days=1–62).");
  }
  const sessions = services().classSessions.list({
    from: berlinDayRange(from).start,
    to: berlinDayRange(addDays(from, days - 1)).end,
    roomId: params.get("roomId") ?? undefined,
  });
  return Response.json({ sessions }, { headers: noStore });
}

/** Creates a scheduled session; public at once. `requestId` makes retries idempotent. */
export async function POST(request: NextRequest) {
  const auth = requireAdminApi(request);
  if ("response" in auth) return auth.response;

  const body = (await readJson(request)) as { requestId?: unknown } | undefined;
  const parsed = parseSessionInput(body);
  if (!parsed.ok) {
    return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: parsed.fieldErrors });
  }
  const requestId =
    typeof body?.requestId === "string" && body.requestId.length > 0 && body.requestId.length <= 100 ? body.requestId : undefined;
  const result = services().classSessions.create(parsed.content, requestId);
  if (!result.ok) return sessionError(result);
  return Response.json({ session: result.session }, { status: 201, headers: noStore });
}
