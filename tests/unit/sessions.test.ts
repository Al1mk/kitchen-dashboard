import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../src/lib/db/database.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";
import type { SessionContent } from "../../src/lib/sessions/schema.ts";

let dir: string;
let db: Db;
const now = new Date("2026-11-02T10:00:00.000Z");
const clock = () => now;
let roomA: string;
let roomB: string;

function session(overrides: Partial<SessionContent> = {}): SessionContent {
  return {
    title: "Statistik",
    instructor: "Prof. Beispiel",
    cohort: "WI 2.0 – 1. Semester",
    term: "WS 2026/27",
    roomId: roomA,
    startsAt: "2026-11-03T08:00:00.000Z", // 09:00 Berlin
    endsAt: "2026-11-03T09:30:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "campus-board-sessions-"));
  db = openDatabase(join(dir, "test.sqlite"));
  const rooms = createRoomRepository(db, clock);
  const base = { name: "Raum", floorId: "EG", type: "seminar", description: "", reservable: false, nameEn: "", descriptionEn: "" } as const;
  const a = rooms.create({ ...base, code: "T-A" });
  const b = rooms.create({ ...base, code: "T-B" });
  if (!a.ok || !b.ok) throw new Error("setup");
  roomA = a.room.id;
  roomB = b.room.id;
});

afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("session repository", () => {
  it("creates a scheduled session with its room and is idempotent per request id", () => {
    const repo = createSessionRepository(db, clock);
    const first = repo.create(session(), "req-1");
    const again = repo.create(session(), "req-1");
    expect(first.ok && again.ok && again.session.id === first.session.id).toBe(true);
    expect(repo.list({ from: "2026-11-01T00:00:00.000Z", to: "2026-11-10T00:00:00.000Z" })).toHaveLength(1);
    expect(first.ok && first.session).toMatchObject({ status: "scheduled", cancelledAt: null, room: { id: roomA, code: "T-A", archived: false } });
  });

  it("rejects an overlapping session in the same room, naming the conflict", () => {
    const repo = createSessionRepository(db, clock);
    const existing = repo.create(session());
    if (!existing.ok) throw new Error("setup");
    const result = repo.create(session({ title: "Mathe", startsAt: "2026-11-03T09:00:00.000Z", endsAt: "2026-11-03T10:00:00.000Z" }));
    expect(result).toEqual({
      ok: false,
      reason: "conflict",
      conflict: { id: existing.session.id, title: "Statistik", startsAt: "2026-11-03T08:00:00.000Z", endsAt: "2026-11-03T09:30:00.000Z" },
    });
  });

  it("allows back-to-back sessions, other rooms and slots of cancelled sessions", () => {
    const repo = createSessionRepository(db, clock);
    const first = repo.create(session());
    if (!first.ok) throw new Error("setup");
    expect(repo.create(session({ startsAt: "2026-11-03T09:30:00.000Z", endsAt: "2026-11-03T11:00:00.000Z" })).ok).toBe(true);
    expect(repo.create(session({ roomId: roomB })).ok).toBe(true);
    repo.cancel(first.session.id);
    expect(repo.create(session({ title: "Ersatz" })).ok).toBe(true);
  });

  it("does not report a session as conflicting with itself when edited", () => {
    const repo = createSessionRepository(db, clock);
    const s = repo.create(session());
    if (!s.ok) throw new Error("setup");
    const updated = repo.update(s.session.id, session({ endsAt: "2026-11-03T10:00:00.000Z" }));
    expect(updated.ok && updated.session.endsAt).toBe("2026-11-03T10:00:00.000Z");
  });

  it("rejects unknown and archived rooms for new assignments", () => {
    const repo = createSessionRepository(db, clock);
    expect(repo.create(session({ roomId: "missing" }))).toEqual({ ok: false, reason: "room_not_found" });
    createRoomRepository(db, clock).archive(roomB);
    expect(repo.create(session({ roomId: roomB }))).toEqual({ ok: false, reason: "room_archived" });
    const s = repo.create(session());
    if (!s.ok) throw new Error("setup");
    expect(repo.update(s.session.id, session({ roomId: roomB }))).toEqual({ ok: false, reason: "room_archived" });
  });

  it("still lets a past session in an archived room be edited", () => {
    const repo = createSessionRepository(db, clock);
    const past = repo.create(session({ roomId: roomB, startsAt: "2026-10-27T08:00:00.000Z", endsAt: "2026-10-27T09:00:00.000Z" }));
    if (!past.ok) throw new Error("setup");
    createRoomRepository(db, clock).archive(roomB);
    const edited = repo.update(past.session.id, session({ roomId: roomB, title: "Korrigiert", startsAt: "2026-10-27T08:00:00.000Z", endsAt: "2026-10-27T09:00:00.000Z" }));
    expect(edited.ok && edited.session.room).toMatchObject({ id: roomB, archived: true });
  });

  it("cancels and reinstates; reinstating checks the room again", () => {
    const repo = createSessionRepository(db, clock);
    const s = repo.create(session());
    if (!s.ok) throw new Error("setup");
    const cancelled = repo.cancel(s.session.id);
    expect(cancelled.ok && cancelled.session).toMatchObject({ status: "cancelled", cancelledAt: now.toISOString() });
    expect(repo.cancel(s.session.id)).toEqual({ ok: false, reason: "not_scheduled" });

    const replacement = repo.create(session({ title: "Ersatz" }));
    expect(replacement.ok).toBe(true);
    expect(repo.reinstate(s.session.id)).toMatchObject({ ok: false, reason: "conflict" });

    if (replacement.ok) repo.cancel(replacement.session.id);
    const back = repo.reinstate(s.session.id);
    expect(back.ok && back.session.status).toBe("scheduled");
    expect(repo.reinstate(s.session.id)).toEqual({ ok: false, reason: "not_cancelled" });
    expect(repo.cancel("missing")).toEqual({ ok: false, reason: "not_found" });
  });

  it("lists one Berlin day publicly, including cancelled sessions, with allowlisted fields", () => {
    const repo = createSessionRepository(db, clock);
    // 00:30 Berlin on 3 Nov is 23:30 UTC on 2 Nov: must belong to 3 Nov.
    repo.create(session({ title: "Früh", startsAt: "2026-11-02T23:30:00.000Z", endsAt: "2026-11-03T00:30:00.000Z" }));
    const late = repo.create(session({ title: "Spät", roomId: roomB, startsAt: "2026-11-03T21:00:00.000Z", endsAt: "2026-11-03T22:30:00.000Z" }));
    repo.create(session({ title: "Nächster Tag", startsAt: "2026-11-03T23:00:00.000Z", endsAt: "2026-11-04T00:00:00.000Z" }));
    if (!late.ok) throw new Error("setup");
    repo.cancel(late.session.id);

    const day = repo.listPublicDay("2026-11-03");
    expect(day.map((s) => [s.title, s.status])).toEqual([
      ["Früh", "scheduled"],
      ["Spät", "cancelled"],
    ]);
    expect(Object.keys(day[0]).sort()).toEqual(["cohort", "endsAt", "id", "instructor", "isDemo", "room", "startsAt", "status", "term", "title"]);
    expect(Object.keys(day[0].room).sort()).toEqual(["code", "floorId", "id", "name", "nameEn"]);
    expect(repo.listPublicDay("2026-11-03", roomB).map((s) => s.title)).toEqual(["Spät"]);
  });
});
