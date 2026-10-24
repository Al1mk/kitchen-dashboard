import { createHash, randomBytes } from "node:crypto";
import type { Db } from "../db/database.ts";

// Server-side sessions. The browser holds a random token; the database only
// stores its SHA-256 hash, so a leaked database file cannot be replayed.

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionStore(db: Db, clock: () => Date = () => new Date(), ttlMs = SESSION_TTL_MS) {
  return {
    create(username: string): { token: string; expiresAt: Date } {
      const token = randomBytes(32).toString("base64url");
      const now = clock();
      const expiresAt = new Date(now.getTime() + ttlMs);
      db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now.toISOString());
      db.prepare("INSERT INTO sessions (id_hash, username, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
        hashToken(token),
        username,
        now.toISOString(),
        expiresAt.toISOString(),
      );
      return { token, expiresAt };
    },

    validate(token: string): { username: string } | null {
      const row = db
        .prepare<[string], { username: string; expires_at: string }>(
          "SELECT username, expires_at FROM sessions WHERE id_hash = ?",
        )
        .get(hashToken(token));
      if (!row || Date.parse(row.expires_at) <= clock().getTime()) return null;
      return { username: row.username };
    },

    delete(token: string): void {
      db.prepare("DELETE FROM sessions WHERE id_hash = ?").run(hashToken(token));
    },
  };
}
