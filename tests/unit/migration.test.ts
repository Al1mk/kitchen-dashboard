import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it } from "vitest";
import { openDatabase } from "../../src/lib/db/database.ts";
import { MIGRATIONS } from "../../src/lib/db/migrations.ts";

// Older databases must upgrade in place without losing data.

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "campus-board-migration-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("upgrades an M1 database to the current schema and keeps its announcements and sessions", () => {
  const path = join(dir, "m1.sqlite");
  const old = new Database(path);
  old.exec(MIGRATIONS[0]);
  old.pragma("user_version = 1");
  old
    .prepare("INSERT INTO announcements (id, status, draft_json, created_at, updated_at) VALUES (?, 'draft', ?, ?, ?)")
    .run("a1", JSON.stringify({ title: "Alt" }), "2026-10-24T10:00:00.000Z", "2026-10-24T10:00:00.000Z");
  old
    .prepare("INSERT INTO sessions (id_hash, username, created_at, expires_at) VALUES ('h', 'admin', 'x', 'y')")
    .run();
  old.close();

  const db = openDatabase(path);
  expect(db.pragma("user_version", { simple: true })).toBe(MIGRATIONS.length);
  // Migration 3 only adds empty English fields to the stored content.
  const row = db.prepare<[], { id: string; draft_json: string }>("SELECT id, draft_json FROM announcements").get()!;
  expect(row.id).toBe("a1");
  expect(JSON.parse(row.draft_json)).toEqual({ title: "Alt", titleEn: "", bodyEn: "" });
  expect(db.prepare("SELECT username FROM sessions").all()).toEqual([{ username: "admin" }]);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
  expect(tables).toEqual(expect.arrayContaining([{ name: "rooms" }, { name: "class_sessions" }]));
  db.close();
});

it("refuses to delete a room that sessions still reference", () => {
  const db = openDatabase(join(dir, "fk.sqlite"));
  const t = "2026-11-02T10:00:00.000Z";
  db.prepare(
    "INSERT INTO rooms (id, code, name, floor_id, type, created_at, updated_at) VALUES ('r', 'X', 'X', 'EG', 'other', ?, ?)",
  ).run(t, t);
  db.prepare(
    `INSERT INTO class_sessions (id, title, instructor, cohort, term, room_id, starts_at, ends_at, status, created_at, updated_at)
     VALUES ('s', 'T', 'I', 'C', 'WS 2026/27', 'r', ?, ?, 'scheduled', ?, ?)`,
  ).run(t, "2026-11-02T11:00:00.000Z", t, t);
  expect(() => db.prepare("DELETE FROM rooms WHERE id = 'r'").run()).toThrow(/FOREIGN KEY/);
  db.close();
});
