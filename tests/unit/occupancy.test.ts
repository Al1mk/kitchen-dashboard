import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validatePeriod } from "../../src/lib/bookings/policy.ts";
import { createBookingRepository } from "../../src/lib/bookings/repository.ts";
import { openDatabase, type Db } from "../../src/lib/db/database.ts";
import { seedTeamDemo } from "../../src/lib/map/team-seed.ts";
import { overlaps } from "../../src/lib/occupancy/conflicts.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";

// T10: one occupancy invariant across bookings, classes and room mutations.

let dir: string;
let db: Db;
const now = new Date("2026-11-02T06:00:00.000Z"); // Monday 07:00 Berlin
const clock = () => now;
const ROOM = "lcc-demo-room-k1-120"; // seeded reservable demo room
let n = 0;
const secret = (bytes: number) => Buffer.alloc(bytes, ++n % 250).toString("base64url");
const booking = (startTime: string, endTime: string, date = "2026-11-03", roomId = ROOM) => ({
  roomId, date, startTime, endTime, requestId: secret(16), cancelToken: secret(32),
});
// Tuesday 2026-11-03 Berlin = UTC+1
const cls = (startsAt: string, endsAt: string, roomId = ROOM) => ({
  title: "Demo-Kurs", instructor: "Demo", cohort: "Demo", term: "WS 2026/27", roomId,
  startsAt: `2026-11-03T${startsAt}:00.000Z`, endsAt: `2026-11-03T${endsAt}:00.000Z`,
});

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "occupancy-"));
  db = openDatabase(join(dir, "o.sqlite"));
  seedTeamDemo(db, now);
  db.prepare("DELETE FROM class_sessions").run(); // start each test without the sample sessions
});
afterEach(() => {
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("half-open overlap", () => {
  it("detects overlap in both directions and treats touching intervals as free", () => {
    const a = { startsAt: "2026-11-03T10:00:00.000Z", endsAt: "2026-11-03T11:00:00.000Z" };
    expect(overlaps(a, { startsAt: "2026-11-03T10:30:00.000Z", endsAt: "2026-11-03T11:30:00.000Z" })).toBe(true);
    expect(overlaps(a, { startsAt: "2026-11-03T09:30:00.000Z", endsAt: "2026-11-03T10:30:00.000Z" })).toBe(true);
    expect(overlaps(a, { startsAt: "2026-11-03T09:00:00.000Z", endsAt: "2026-11-03T12:00:00.000Z" })).toBe(true);
    expect(overlaps(a, { startsAt: "2026-11-03T11:00:00.000Z", endsAt: "2026-11-03T12:00:00.000Z" })).toBe(false);
    expect(overlaps(a, { startsAt: "2026-11-03T09:00:00.000Z", endsAt: "2026-11-03T10:00:00.000Z" })).toBe(false);
  });
});

describe("bookability is the admin flag, not the room code (A-05)", () => {
  it("keeps a seeded room bookable after its code and name are edited", () => {
    const rooms = createRoomRepository(db, clock);
    const before = rooms.get(ROOM)!;
    expect(before.reservable).toBe(true);
    const edited = rooms.update(ROOM, { ...before, code: "K1-999", name: "Umbenannt" });
    expect(edited).toMatchObject({ ok: true, room: { id: ROOM, code: "K1-999", reservable: true } });
    const bookings = createBookingRepository(db, clock);
    expect(bookings.availability(ROOM, "2026-11-03").ok).toBe(true);
    expect(bookings.create(booking("13:00", "14:00")).ok).toBe(true);
  });
});

describe("classes and bookings share one invariant", () => {
  it("rejects a class over a booking (both directions, any overlap) without changing the booking", () => {
    const bookings = createBookingRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const b = bookings.create(booking("13:00", "14:00")); // 12:00–13:00 UTC
    if (!b.ok) throw new Error("setup");
    for (const [s, e] of [["11:30", "12:30"], ["12:30", "13:30"], ["11:00", "14:00"], ["12:15", "12:45"]]) {
      expect(sessions.create(cls(s, e))).toMatchObject({ ok: false, reason: "booking_conflict", conflict: { kind: "booking", id: b.booking.id } });
    }
    expect(sessions.create(cls("11:00", "12:00")).ok).toBe(true); // adjacent before
    expect(sessions.create(cls("13:00", "14:00")).ok).toBe(true); // adjacent after
    expect(db.prepare("SELECT status FROM room_bookings WHERE id = ?").get(b.booking.id)).toEqual({ status: "confirmed" });
  });

  it("rejects moving a class into a booked room or time and keeps the class unchanged", () => {
    const bookings = createBookingRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    expect(bookings.create(booking("13:00", "14:00")).ok).toBe(true);
    const other = sessions.create(cls("12:00", "13:00", "lcc-demo-room-k1-103"));
    if (!other.ok) throw new Error("setup");
    const moved = sessions.update(other.session.id, cls("12:00", "13:00", ROOM));
    expect(moved).toMatchObject({ ok: false, reason: "booking_conflict" });
    expect(sessions.get(other.session.id)).toMatchObject({ roomId: "lcc-demo-room-k1-103", startsAt: "2026-11-03T12:00:00.000Z" });
    // Editing the class within its own slot is not a conflict with itself.
    expect(sessions.update(other.session.id, cls("12:00", "12:45", "lcc-demo-room-k1-103")).ok).toBe(true);
  });

  it("does not let a cancelled class block a booking, and refuses reinstating it over the booking", () => {
    const bookings = createBookingRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const c = sessions.create(cls("12:00", "13:00"));
    if (!c.ok) throw new Error("setup");
    expect(bookings.create(booking("13:00", "14:00"))).toMatchObject({ ok: false, reason: "time_conflict" });
    expect(sessions.cancel(c.session.id).ok).toBe(true);
    expect(bookings.create(booking("13:00", "14:00")).ok).toBe(true);
    expect(sessions.reinstate(c.session.id)).toMatchObject({ ok: false, reason: "booking_conflict" });
    expect(sessions.get(c.session.id)!.status).toBe("cancelled");
  });

  it("frees the slot for classes when the booking is cancelled", () => {
    const bookings = createBookingRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const b = bookings.create(booking("13:00", "14:00"));
    if (!b.ok) throw new Error("setup");
    expect(sessions.create(cls("12:00", "13:00")).ok).toBe(false);
    expect(bookings.cancelByAdmin(b.booking.id).ok).toBe(true);
    expect(sessions.create(cls("12:00", "13:00")).ok).toBe(true);
  });

  it("keeps class-vs-class conflicts as room_conflict (compatibility)", () => {
    const sessions = createSessionRepository(db, clock);
    expect(sessions.create(cls("12:00", "13:00")).ok).toBe(true);
    expect(sessions.create(cls("12:30", "13:30"))).toMatchObject({ ok: false, reason: "conflict", conflict: { title: "Demo-Kurs" } });
  });
});

describe("room mutations respect bookings", () => {
  it("refuses archiving with upcoming bookings and reports both counts; allows it after cancellation", () => {
    const bookings = createBookingRepository(db, clock);
    const sessions = createSessionRepository(db, clock);
    const rooms = createRoomRepository(db, clock);
    const b = bookings.create(booking("13:00", "14:00"));
    const c = sessions.create(cls("15:00", "16:00"));
    if (!b.ok || !c.ok) throw new Error("setup");
    expect(rooms.archive(ROOM)).toEqual({ ok: false, reason: "in_use", upcomingSessions: 1, upcomingBookings: 1 });
    expect(sessions.cancel(c.session.id).ok).toBe(true);
    expect(rooms.archive(ROOM)).toEqual({ ok: false, reason: "in_use", upcomingSessions: 0, upcomingBookings: 1 });
    expect(bookings.cancelByAdmin(b.booking.id).ok).toBe(true);
    expect(rooms.archive(ROOM).ok).toBe(true);
    expect(bookings.create(booking("16:00", "17:00"))).toMatchObject({ ok: false, reason: "room_not_reservable" });
  });

  it("refuses switching reservable off while bookings lie ahead and keeps the room unchanged", () => {
    const bookings = createBookingRepository(db, clock);
    const rooms = createRoomRepository(db, clock);
    const b = bookings.create(booking("13:00", "14:00"));
    if (!b.ok) throw new Error("setup");
    const room = rooms.get(ROOM)!;
    expect(rooms.update(ROOM, { ...room, name: "Neu", reservable: false })).toEqual({ ok: false, reason: "booking_in_use" });
    expect(rooms.get(ROOM)).toMatchObject({ name: room.name, reservable: true });
    expect(bookings.cancelByAdmin(b.booking.id).ok).toBe(true);
    expect(rooms.update(ROOM, { ...room, reservable: false }).ok).toBe(true);
  });
});

describe("availability and validation contract", () => {
  it("returns free spans on the 15-minute grid around off-grid classes", () => {
    const sessions = createSessionRepository(db, clock);
    // 12:07–12:23 Berlin = 11:07–11:23 UTC
    expect(sessions.create(cls("11:07", "11:23")).ok).toBe(true);
    const result = createBookingRepository(db, clock).availability(ROOM, "2026-11-03");
    if (!result.ok) throw new Error("availability failed");
    expect(result.busy).toEqual([{ startTime: "12:07", endTime: "12:23", kind: "class" }]);
    expect(result.free).toEqual([
      { startTime: "08:00", endTime: "12:00" },
      { startTime: "12:30", endTime: "20:00" },
    ]);
    for (const span of result.free) {
      expect(Number(span.startTime.slice(3)) % 15).toBe(0);
      expect(Number(span.endTime.slice(3)) % 15).toBe(0);
    }
  });

  it("drops gaps shorter than one minimum booking", () => {
    const sessions = createSessionRepository(db, clock);
    expect(sessions.create(cls("09:00", "10:05")).ok).toBe(true); // 10:00–11:05 Berlin
    expect(sessions.create(cls("10:20", "11:00")).ok).toBe(true); // 11:20–12:00 Berlin; gap 11:05–11:20 → 11:15–11:15
    const result = createBookingRepository(db, clock).availability(ROOM, "2026-11-03");
    if (!result.ok) throw new Error("availability failed");
    expect(result.free).toEqual([
      { startTime: "08:00", endTime: "10:00" },
      { startTime: "12:00", endTime: "20:00" },
    ]);
  });

  it("names the reason of a rejected period with a stable code", () => {
    expect(validatePeriod("2026-11-30", "13:00", "14:00", now)).toMatchObject({ ok: false, detail: "date_out_of_range" });
    expect(validatePeriod("2026-11-03", "07:00", "08:00", now)).toMatchObject({ ok: false, detail: "invalid_time" });
    expect(validatePeriod("2026-11-03", "13:05", "14:00", now)).toMatchObject({ ok: false, detail: "grid" });
    expect(validatePeriod("2026-11-03", "13:00", "15:15", now)).toMatchObject({ ok: false, detail: "grid" });
    expect(validatePeriod("2026-11-02", "06:00", "07:00", now)).toMatchObject({ ok: false, detail: "invalid_time" });
    expect(validatePeriod("2026-11-02", "08:00", "09:00", new Date("2026-11-02T07:30:00.000Z"))).toMatchObject({ ok: false, detail: "in_past" });
    expect(validatePeriod("2026-11-15", "13:00", "14:00", now).ok).toBe(true); // last of 14 dates
    expect(validatePeriod("2026-11-16", "13:00", "14:00", now)).toMatchObject({ ok: false, detail: "date_out_of_range" });
  });
});
