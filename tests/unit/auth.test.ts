import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/lib/auth/password.ts";
import { createSessionStore } from "../../src/lib/auth/sessions.ts";
import { openDatabase } from "../../src/lib/db/database.ts";

describe("password hashing", () => {
  it("verifies the correct password and rejects others", async () => {
    const hash = await hashPassword("ein langes Testpasswort");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash).not.toContain("ein langes Testpasswort");
    expect(hash).not.toContain("$");
    expect(await verifyPassword("ein langes Testpasswort", hash)).toBe(true);
    expect(await verifyPassword("falsch", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salted)", async () => {
    expect(await hashPassword("abc12345")).not.toBe(await hashPassword("abc12345"));
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("x", "")).toBe(false);
    expect(await verifyPassword("x", "scrypt:broken")).toBe(false);
  });
});

describe("session store", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "campus-board-auth-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("creates, validates, expires and deletes sessions", () => {
    const db = openDatabase(join(dir, "auth.sqlite"));
    let current = new Date("2026-10-24T12:00:00.000Z");
    const store = createSessionStore(db, () => current, 60 * 60 * 1000);

    const { token } = store.create("demo-admin");
    expect(token.length).toBeGreaterThanOrEqual(43);
    expect(store.validate(token)?.username).toBe("demo-admin");
    expect(store.validate("unknown-token")).toBeNull();

    // Token itself is never stored in plain text.
    const rows = db.prepare("SELECT id_hash FROM sessions").all() as { id_hash: string }[];
    expect(rows.every((r) => r.id_hash !== token)).toBe(true);

    current = new Date("2026-10-24T13:00:01.000Z");
    expect(store.validate(token)).toBeNull();

    current = new Date("2026-10-24T12:00:00.000Z");
    const second = store.create("demo-admin");
    store.delete(second.token);
    expect(store.validate(second.token)).toBeNull();
    db.close();
  });
});
