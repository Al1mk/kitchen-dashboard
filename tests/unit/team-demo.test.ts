import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../src/lib/db/database.ts";
import { markerFor } from "../../src/lib/map/config.ts";
import { TEAM_DEMO_ROOMS } from "../../src/lib/map/team-catalog.ts";
import { seedTeamDemo } from "../../src/lib/map/team-seed.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";

let dir: string;
let db: Db;
const now = new Date("2026-11-02T07:00:00.000Z"); // Monday 08:00 Berlin

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "team-demo-"));
  db = openDatabase(join(dir, "demo.sqlite"));
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

const room = (id: string) =>
  db.prepare<[string], { code: string; name: string; reservable: number; is_demo: number; archived_at: string | null; updated_at: string }>(
    "SELECT code, name, reservable, is_demo, archived_at, updated_at FROM rooms WHERE id = ?",
  ).get(id);

describe("team demo seed", () => {
  it("creates the 48 catalog rooms with fixed ids, demo flag and the 21 initial booking choices", () => {
    const report = seedTeamDemo(db, now);
    expect(report.roomsCreated).toHaveLength(48);
    expect(report.collisions).toEqual([]);
    const rows = db.prepare<[], { id: string; reservable: number; is_demo: number }>("SELECT id, reservable, is_demo FROM rooms").all();
    expect(rows).toHaveLength(48);
    expect(rows.every((r) => r.is_demo === 1)).toBe(true);
    expect(rows.filter((r) => r.reservable === 1)).toHaveLength(21);
    expect(room("lcc-demo-room-k1-114")).toMatchObject({ code: "K1-114", reservable: 1 });
    expect(markerFor({ id: "lcc-demo-room-k1-114", floorId: "1OG" }).ok).toBe(false);
    expect(report.sessionsCreated).toBe(4);
  });

  it("is idempotent: a second run creates nothing and changes nothing", () => {
    seedTeamDemo(db, now);
    const before = db.prepare("SELECT * FROM rooms ORDER BY id").all();
    const report = seedTeamDemo(db, new Date(now.getTime() + 60_000));
    expect(report.roomsCreated).toEqual([]);
    expect(report.roomsKept).toHaveLength(48);
    expect(report.sessionsCreated).toBe(0);
    expect(db.prepare("SELECT * FROM rooms ORDER BY id").all()).toEqual(before);
  });

  it("never overwrites a room that owns the same code under another id", () => {
    const rooms = createRoomRepository(db, () => now);
    const own = rooms.create({ code: "K1-120", name: "Katjas Raum", floorId: "2OG", type: "office", description: "", reservable: false, nameEn: "", descriptionEn: "" });
    if (!own.ok) throw new Error("setup");
    const report = seedTeamDemo(db, now);
    expect(report.collisions).toEqual([{ code: "K1-120", catalogId: "lcc-demo-room-k1-120", existingId: own.room.id }]);
    expect(room("lcc-demo-room-k1-120")).toBeUndefined();
    expect(rooms.get(own.room.id)).toMatchObject({ code: "K1-120", name: "Katjas Raum", floorId: "2OG", reservable: false });
    // The map position stays bound to the catalog id; the other room gets no marker.
    expect(markerFor({ id: own.room.id, floorId: "2OG" }).ok).toBe(false);
    // The demo session planned for that catalog room is skipped, not moved.
    expect(report.sessionsCreated).toBe(2);
    expect(report.sessionsSkipped).toBe(2);
  });

  it("keeps archived and edited rooms exactly as they are (no revival, no re-flagging)", () => {
    seedTeamDemo(db, now);
    const rooms = createRoomRepository(db, () => now);
    // No sessions in K1-104, so it can be archived.
    expect(rooms.archive("lcc-demo-room-k1-104").ok).toBe(true);
    const edited = rooms.update("lcc-demo-room-k1-121", { code: "K1-121X", name: "Umbenannt", floorId: "1OG", type: "seminar", description: "", reservable: false, nameEn: "", descriptionEn: "" });
    expect(edited.ok).toBe(true);
    const archivedBefore = room("lcc-demo-room-k1-104");
    const editedBefore = room("lcc-demo-room-k1-121");

    const report = seedTeamDemo(db, now);
    expect(report.archivedKept).toEqual(["lcc-demo-room-k1-104"]);
    expect(report.roomsCreated).toEqual([]);
    expect(room("lcc-demo-room-k1-104")).toEqual(archivedBefore);
    expect(room("lcc-demo-room-k1-121")).toEqual(editedBefore);
    // The old code is now free, but the seed does not create a second K1-121.
    expect(db.prepare("SELECT COUNT(*) AS n FROM rooms WHERE code = 'K1-121'").get()).toEqual({ n: 0 });
  });

  it("does not add a demo session into a slot already taken by a class or booking", () => {
    // Rooms first (no sessions yet would be fine, but the seed adds both in one run):
    seedTeamDemo(db, now);
    db.prepare("DELETE FROM class_sessions").run();
    // Monday 10:30–11:00 Berlin in K1-120 overlaps the planned 10:00–11:30 demo class.
    db.prepare(
      `INSERT INTO room_bookings (id, create_request_id, room_id, starts_at, ends_at, cancel_token_hash, status, is_demo, created_at, updated_at)
       VALUES ('b1', 'r1', 'lcc-demo-room-k1-120', '2026-11-02T09:30:00.000Z', '2026-11-02T10:00:00.000Z', ?, 'confirmed', 1, ?, ?)`,
    ).run("0".repeat(64), now.toISOString(), now.toISOString());
    const report = seedTeamDemo(db, now);
    expect(report.sessionsCreated).toBe(3);
    expect(report.sessionsSkipped).toBe(1);
    const k120Monday = db.prepare("SELECT COUNT(*) AS n FROM class_sessions WHERE room_id = 'lcc-demo-room-k1-120' AND starts_at < '2026-11-03'").get();
    expect(k120Monday).toEqual({ n: 0 });
  });
});

describe("seed command guard", () => {
  const run = (env: Record<string, string>, args: string[] = []) =>
    spawnSync(process.execPath, ["scripts/seed-team-demo.ts", ...args], { env: { NODE_ENV: "test", PATH: process.env.PATH ?? "", ...env }, encoding: "utf8" });

  it("refuses to run without an explicit database path", () => {
    const result = run({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("CAMPUS_BOARD_DB_PATH");
  });

  it("refuses the real data/ directory", () => {
    const result = run({ CAMPUS_BOARD_DB_PATH: "data/campus-board.sqlite" }, ["--yes"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("inside data/");
  });

  it("asks for --yes before writing", () => {
    const target = join(dir, "cli.sqlite");
    const result = run({ CAMPUS_BOARD_DB_PATH: target });
    expect(result.status).toBe(1);
    expect(existsSync(target)).toBe(false);
  });

  it("seeds a disposable database when confirmed", () => {
    const target = resolve(dir, "cli.sqlite");
    const result = run({ CAMPUS_BOARD_DB_PATH: target }, ["--yes"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("48 neu");
  });
});
