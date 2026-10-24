import { join, resolve } from "node:path";

// Runtime configuration from the environment (.env.local is loaded by Next.js).
// Credentials are never given defaults: without them, login is disabled.

export function getDatabasePath(): string {
  // Runtime data path, not a source file: excluded from build file tracing.
  const configured = process.env.CAMPUS_BOARD_DB_PATH;
  return configured
    ? resolve(/* turbopackIgnore: true */ configured)
    : join(/* turbopackIgnore: true */ process.cwd(), "data", "campus-board.sqlite");
}

export function getAdminCredentials(): { username: string; passwordHash: string } | null {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!username || !passwordHash) return null;
  return { username, passwordHash };
}

/**
 * Secure cookies in production. A plain-HTTP LAN demo can opt out explicitly
 * with CAMPUS_BOARD_INSECURE_COOKIES=true (documented in README).
 */
export function secureCookiesEnabled(): boolean {
  if (process.env.CAMPUS_BOARD_INSECURE_COOKIES === "true") return false;
  return process.env.NODE_ENV === "production";
}
