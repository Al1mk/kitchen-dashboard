import type { NextRequest } from "next/server";
import { jsonError, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/request.ts";
import { isSameOrigin } from "@/lib/http/origin.ts";
import { services } from "@/lib/server.ts";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin", "Anfrage von fremder Herkunft abgelehnt.");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) services().sessions.delete(token);

  const response = Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const options = sessionCookieOptions();
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=${options.path}; Max-Age=0; HttpOnly; SameSite=Lax${options.secure ? "; Secure" : ""}`,
  );
  return response;
}
