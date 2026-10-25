import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../src/lib/db/database.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";
import { parseRoomInput, type RoomContent } from "../../src/lib/rooms/schema.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";

let dir: string;
let db: Db;
let now = new Date("2026-11-02T10:00:00.000Z");
const clock = () => now;

function room(overrides: Partial<RoomContent> = {}): RoomContent {
  return { code: "T-1.01", name: "Seminarraum Test", floorId: "1OG", type: "seminar", description: "", reservable: false, ...overrides };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "campus-board-rooms-"));
  db = openDatabase(join(dir, "test.sqlite"));
  now = new Date("2026-11-02T10:00:00.000Z");
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("parseRoomInput", () => {
  const valid = { code: " T-1.01 ", name: " Seminarraum Test ", floorId: "1OG", type: "seminar", description: " Beamer ", reservable: true };

  it("accepts and trims valid input", () => {
    expect(parseRoomInput(valid)).toEqual({
      ok: true,
      content: { code: "T-1.01", name: "Seminarraum Test", floorId: "1OG", type: "seminar", description: "Beamer", reservable: true },
    });
  });

  it("rejects missing or unknown values with German field errors", () => {
    const result = parseRoomInput({ ...valid, code: "", name: "", floorId: "5OG", type: "pool", reservable: "ja" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.fieldErrors).sort()).toEqual(["code", "floorId", "name", "reservable", "type"]);
      expect(result.fieldErrors.code?.[0]).toMatch(/Raumnummer/);
    }
  });

  it("rejects codes with unsupported characters and over-long text", () => {
    expect(parseRoomInput({ ...valid, code: "<b>1</b>" }).ok).toBe(false);
    expect(parseRoomInput({ ...valid, code: "x".repeat(21) }).ok).toBe(false);
    expect(parseRoomInput({ ...valid, description: "x".repeat(501) }).ok).toBe(false);
  });
});

describe("room repository", () => {
  it("creates rooms with a stable id and persists them", () => {
    const repo = createRoomRepository(db, clock);
    const created = repo.create(room());
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.room.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.room).toMatchObject({ code: "T-1.01", archivedAt: null, isDemo: false, upcomingSessions: 0 });
    expect(repo.get(created.room.id)).toEqual(created.room);
  });

  it("rejects a duplicate room code, ignoring letter case", () => {
    const repo = createRoomRepository(db, clock);
    repo.create(room({ code: "A.1" }));
    expect(repo.create(room({ code: "a.1" }))).toEqual({ ok: false, reason: "duplicate_code" });
  });

  it("keeps session references when a room is renamed or recoded", () => {
    const rooms = createRoomRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const r = rooms.create(room());
    if (!r.ok) throw new Error("setup");
    const s = sessions.create({
      title: "Statistik",
      instructor: "Prof. Beispiel",
      cohort: "WI 1",
      term: "WS 2026/27",
      roomId: r.room.id,
      startsAt: "2026-11-03T08:00:00.000Z",
      endsAt: "2026-11-03T09:30:00.000Z",
    });
    if (!s.ok) throw new Error("setup");

    const updated = rooms.update(r.room.id, room({ code: "T-1.02", name: "Neuer Name" }));
    expect(updated.ok).toBe(true);
    expect(sessions.get(s.session.id)?.room).toMatchObject({ id: r.room.id, code: "T-1.02", name: "Neuer Name" });
  });

  it("rejects an update to a code another room already uses", () => {
    const repo = createRoomRepository(db, clock);
    repo.create(room({ code: "A.1" }));
    const b = repo.create(room({ code: "B.1" }));
    if (!b.ok) throw new Error("setup");
    expect(repo.update(b.room.id, room({ code: "A.1" }))).toEqual({ ok: false, reason: "duplicate_code" });
    expect(repo.update("missing", room())).toEqual({ ok: false, reason: "not_found" });
  });

  it("blocks archiving while scheduled sessions are still ahead, allows it once they are cancelled or past", () => {
    const rooms = createRoomRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const r = rooms.create(room());
    if (!r.ok) throw new Error("setup");
    const base = { title: "Statistik", instructor: "P", cohort: "WI 1", term: "WS 2026/27", roomId: r.room.id };
    sessions.create({ ...base, startsAt: "2026-10-30T08:00:00.000Z", endsAt: "2026-10-30T09:30:00.000Z" }); // past
    const future = sessions.create({ ...base, startsAt: "2026-11-05T08:00:00.000Z", endsAt: "2026-11-05T09:30:00.000Z" });
    if (!future.ok) throw new Error("setup");

    expect(rooms.get(r.room.id)?.upcomingSessions).toBe(1);
    expect(rooms.archive(r.room.id)).toEqual({ ok: false, reason: "in_use", upcomingSessions: 1 });

    sessions.cancel(future.session.id);
    const archived = rooms.archive(r.room.id);
    expect(archived.ok && archived.room.archivedAt).toBe("2026-11-02T10:00:00.000Z");
    expect(rooms.archive(r.room.id)).toEqual({ ok: false, reason: "already_archived" });
  });

  it("restores an archived room", () => {
    const repo = createRoomRepository(db, clock);
    const r = repo.create(room());
    if (!r.ok) throw new Error("setup");
    repo.archive(r.room.id);
    const restored = repo.restore(r.room.id);
    expect(restored.ok && restored.room.archivedAt).toBeNull();
    expect(repo.restore(r.room.id)).toEqual({ ok: false, reason: "not_archived" });
  });

  it("lists only active rooms publicly, ordered by floor then code, with allowlisted fields", () => {
    const repo = createRoomRepository(db, clock);
    repo.create(room({ code: "T-1.10", floorId: "1OG" }));
    repo.create(room({ code: "T-1.9", floorId: "1OG" }));
    repo.create(room({ code: "T-0.01", floorId: "EG", description: "Küche" }));
    const gone = repo.create(room({ code: "T-2.01", floorId: "2OG" }));
    if (!gone.ok) throw new Error("setup");
    repo.archive(gone.room.id);

    const listed = repo.listPublic();
    expect(listed.map((r) => r.code)).toEqual(["T-0.01", "T-1.9", "T-1.10"]);
    expect(Object.keys(listed[0]).sort()).toEqual(["code", "description", "floorId", "id", "isDemo", "name", "reservable", "type"]);
    expect(repo.list({ includeArchived: false }).map((r) => r.code)).not.toContain("T-2.01");
    expect(repo.list({ includeArchived: true }).map((r) => r.code)).toContain("T-2.01");
  });

  it("survives reopening the database", () => {
    const path = join(dir, "persist.sqlite");
    const first = openDatabase(path);
    const r = createRoomRepository(first, clock).create(room());
    first.close();
    const second = openDatabase(path);
    expect(r.ok && createRoomRepository(second, clock).get(r.room.id)?.code).toBe("T-1.01");
    second.close();
  });
});
