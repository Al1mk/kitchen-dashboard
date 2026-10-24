import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { openDatabase } from "../../src/lib/db/database.ts";

// Regression for review finding R-003: the seed script must read the database
// path from the same .env files as the app (Next.js), not only from the shell.

const SCRIPT = resolve("scripts/seed-demo.ts");
let dir: string;

beforeEach(() => {
  dir = realpathSync(mkdtempSync(join(tmpdir(), "campus-board-seed-")));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

it("seeds the database configured in .env.local, not the default path", () => {
  writeFileSync(join(dir, ".env.local"), "CAMPUS_BOARD_DB_PATH=custom/board.sqlite\n");
  // Vitest sets NODE_ENV=test, in which Next.js skips .env.local.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== "CAMPUS_BOARD_DB_PATH" && key !== "NODE_ENV"),
  ) as NodeJS.ProcessEnv;

  const output = execFileSync(process.execPath, [SCRIPT], { cwd: dir, env, encoding: "utf8" });

  const custom = join(dir, "custom", "board.sqlite");
  expect(output).toContain(custom);
  expect(existsSync(join(dir, "data", "campus-board.sqlite"))).toBe(false);
  const db = openDatabase(custom);
  const rows = db.prepare("SELECT id, status FROM announcements ORDER BY id").all();
  db.close();
  expect(rows).toEqual([
    { id: "demo-entwurf", status: "draft" },
    { id: "demo-spieleabend", status: "published" },
    { id: "demo-willkommen", status: "published" },
  ]);
});
