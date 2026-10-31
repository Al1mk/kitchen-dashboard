import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBookingRepository } from "../../src/lib/bookings/repository.ts";
import { parseBookingInput, validatePeriod } from "../../src/lib/bookings/policy.ts";
import { openDatabase, type Db } from "../../src/lib/db/database.ts";
import { createRoomRepository } from "../../src/lib/rooms/repository.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";

let dir: string;
let db: Db;
let roomId: string;
let now = new Date("2026-11-02T08:00:00.000Z"); // 09:00 Berlin
const clock = () => now;
const requestId = Buffer.alloc(16, 11).toString("base64url");
const cancelToken = Buffer.alloc(32, 22).toString("base64url");

const input = (changes: Partial<{ roomId: string; date: string; startTime: string; endTime: string; requestId: string; cancelToken: string }> = {}) => ({
  roomId, date: "2026-11-03", startTime: "13:00", endTime: "14:00", requestId, cancelToken, ...changes,
});

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "parsa-booking-"));
  db = openDatabase(join(dir, "data.sqlite"));
  now = new Date("2026-11-02T08:00:00.000Z");
  const r = createRoomRepository(db, clock).create({
    code: "K1-103", name: "Test Seminarraum", floorId: "1OG", type: "seminar", description: "",
    reservable: true, nameEn: "Test room", descriptionEn: "",
  }, { isDemo: true });
  if (!r.ok) throw new Error("Room setup failed");
  roomId = r.room.id;
});
afterEach(() => { db.close(); rmSync(dir, { recursive: true, force: true }); });

describe("Demo booking allowlist (Parsa selection)", () => {
  it("rejects a reservable demo room outside the 21-code allowlist at server level", () => {
    const created = createRoomRepository(db, clock).create({
      code: "DEMO-R999", name: "Not on demo list", floorId: "1OG", type: "seminar",
      description: "", reservable: true, nameEn: "", descriptionEn: "",
    }, { isDemo: true });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const repo = createBookingRepository(db, clock);
    expect(repo.availability(created.room.id, "2026-11-03")).toMatchObject({ ok: false, reason: "room_not_reservable" });
    expect(repo.create(input({ roomId: created.room.id }))).toMatchObject({ ok: false, reason: "room_not_reservable" });
  });
});

describe("Parsa booking – integration tests", () => {
  it("creates a persistent demo booking with hashed token only", () => {
    const repo = createBookingRepository(db, clock);
    const result = repo.create(input());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.booking).toMatchObject({ roomId, status: "confirmed", isDemo: true });
    const raw = db.prepare<[string], { cancel_token_hash: string }>("SELECT cancel_token_hash FROM room_bookings WHERE id=?").get(result.booking.id);
    expect(raw?.cancel_token_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(raw?.cancel_token_hash).not.toContain(cancelToken);
    expect(JSON.stringify(result)).not.toContain(cancelToken);
    expect(repo.availability(roomId, "2026-11-03").ok).toBe(true);
  });

  it("allows exactly one booking for an occupied slot; adjacent half-open intervals work", () => {
    const repo = createBookingRepository(db, clock);
    expect(repo.create(input()).ok).toBe(true);
    const other = { requestId: Buffer.alloc(16, 12).toString("base64url"), cancelToken: Buffer.alloc(32, 23).toString("base64url") };
    expect(repo.create(input(other))).toMatchObject({ ok: false, reason: "time_conflict" });
    expect(repo.create(input({ ...other, startTime: "14:00", endTime: "15:00" })).ok).toBe(true);
  });

  it("does not create duplicates on exact retry; rejects request ID reuse with changed data/token", () => {
    const repo = createBookingRepository(db, clock);
    const first = repo.create(input());
    const again = repo.create(input());
    expect(first.ok && again.ok && again.replayed).toBe(true);
    expect(repo.create(input({ endTime: "14:15" }))).toMatchObject({ ok: false, reason: "request_id_reused" });
    expect(repo.create(input({ cancelToken: Buffer.alloc(32, 24).toString("base64url") }))).toMatchObject({ ok: false, reason: "request_id_reused" });
    expect(db.prepare("SELECT COUNT(*) AS n FROM room_bookings").get()).toMatchObject({ n: 1 });
  });

  it("blocks booking during a class and blocks making a class over a booking", () => {
    const sessions = createSessionRepository(db, clock);
    const repo = createBookingRepository(db, clock);
    const sampleClass = { title: "Mathe", instructor: "Prof. Demo", cohort: "WI", term: "WS 2026/27", roomId,
      startsAt: "2026-11-03T11:00:00.000Z", endsAt: "2026-11-03T12:00:00.000Z" }; // 12–13 Berlin
    expect(sessions.create(sampleClass).ok).toBe(true);
    expect(repo.create(input({ startTime: "12:30", endTime: "13:30" }))).toMatchObject({ ok: false, reason: "time_conflict" });
    expect(repo.create(input()).ok).toBe(true);
    expect(sessions.create({ ...sampleClass, startsAt: "2026-11-03T12:30:00.000Z", endsAt: "2026-11-03T13:30:00.000Z" }))
      .toMatchObject({ ok: false, reason: "conflict" });
  });

  it("cancels with the right token; refuses wrong token; frees the slot", () => {
    const repo = createBookingRepository(db, clock);
    const book = repo.create(input());
    if (!book.ok) throw new Error("setup failed");
    expect(repo.cancel(book.booking.id, Buffer.alloc(32, 33).toString("base64url"))).toMatchObject({ ok: false, reason: "not_found" });
    expect(repo.cancel(book.booking.id, cancelToken)).toMatchObject({ ok: true, booking: { status: "cancelled" } });
    expect(repo.cancel(book.booking.id, cancelToken).ok).toBe(true); // idempotent
    const other = { requestId: Buffer.alloc(16, 12).toString("base64url"), cancelToken: Buffer.alloc(32, 23).toString("base64url") };
    expect(repo.create(input(other)).ok).toBe(true);
  });

  it("refuses deleting or disabling a room with future confirmed bookings", () => {
    const repo = createBookingRepository(db, clock);
    expect(repo.create(input()).ok).toBe(true);
    const rooms = createRoomRepository(db, clock);
    expect(rooms.archive(roomId)).toMatchObject({ ok: false, reason: "in_use" });
    const old = rooms.get(roomId)!;
    expect(rooms.update(roomId, {
      code: old.code, name: old.name, floorId: old.floorId, type: old.type,
      description: old.description, nameEn: old.nameEn, descriptionEn: old.descriptionEn, reservable: false,
    })).toMatchObject({ ok: false, reason: "booking_in_use" });
  });

  it("validates 15-minute grid, date window, token format and past times", () => {
    expect(validatePeriod("2026-11-03", "13:05", "14:00", now).ok).toBe(false);
    expect(validatePeriod("2026-12-03", "13:00", "14:00", now).ok).toBe(false);
    expect(validatePeriod("2026-11-03", "13:00", "15:15", now).ok).toBe(false);
    expect(validatePeriod("2026-11-03", "13:00", "14:00", now).ok).toBe(true);
    expect(parseBookingInput(input({ cancelToken: "not-strong" })).ok).toBe(false);
  });
});
