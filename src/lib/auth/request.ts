import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { secureCookiesEnabled } from "../config.ts";
import { isSameOrigin } from "../http/origin.ts";
import { services } from "../server.ts";
import { SESSION_TTL_MS } from "./sessions.ts";

export const SESSION_COOKIE = "cb_admin_session";

export type AdminSession = { username: string; token: string };

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookiesEnabled(),
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

function validate(token: string | undefined): AdminSession | null {
  if (!token) return null;
  const session = services().sessions.validate(token);
  return session ? { username: session.username, token } : null;
}

/** For Server Components: current admin or null. */
export async function getAdminSession(): Promise<AdminSession | null> {
  return validate((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For admin pages: redirects anonymous visitors to the login page. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

export function jsonError(status: number, error: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error, message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * For admin API routes: returns the session, or a ready error response.
 * Mutations (anything but GET/HEAD) additionally require a same-origin request.
 */
export function requireAdminApi(request: NextRequest): { session: AdminSession } | { response: Response } {
  const session = validate(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return { response: jsonError(401, "unauthorized", "Bitte melden Sie sich an.") };
  if (request.method !== "GET" && request.method !== "HEAD" && !isSameOrigin(request)) {
    return { response: jsonError(403, "forbidden_origin", "Anfrage von fremder Herkunft abgelehnt.") };
  }
  return { session };
}

const MAX_BODY_BYTES = 16 * 1024;

/** Reads a small JSON body; returns undefined for oversized or malformed bodies. */
export async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
