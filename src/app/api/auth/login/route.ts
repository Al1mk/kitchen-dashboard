import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { verifyPassword } from "@/lib/auth/password.ts";
import { jsonError, readJson, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/request.ts";
import { getAdminCredentials } from "@/lib/config.ts";
import { isSameOrigin } from "@/lib/http/origin.ts";
import { services } from "@/lib/server.ts";

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, "forbidden_origin", "Anfrage von fremder Herkunft abgelehnt.");

  const credentials = getAdminCredentials();
  if (!credentials) {
    return jsonError(503, "not_configured", "Die Anmeldung ist noch nicht eingerichtet (siehe README).");
  }

  const body = (await readJson(request)) as { username?: unknown; password?: unknown } | undefined;
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  // Always run the password check so timing does not reveal valid usernames.
  const passwordOk = await verifyPassword(password, credentials.passwordHash);
  if (!passwordOk || !sameText(username, credentials.username)) {
    return jsonError(401, "invalid_credentials", "Benutzername oder Passwort ist falsch.");
  }

  const { token } = services().sessions.create(credentials.username);
  const response = Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const options = sessionCookieOptions();
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=${options.path}; Max-Age=${options.maxAge}; HttpOnly; SameSite=Lax${options.secure ? "; Secure" : ""}`,
  );
  return response;
}
