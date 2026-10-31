import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import type { Db } from "../db/database.ts";
import { berlinLocalToUtcIso, utcIsoToBerlinLocal } from "../time/berlin.ts";
import { BOOKING_POLICY, hhmmToMinutes, isBookingDateInRange, isDemoBookableRoom, minutesToHhmm, validatePeriod, type BookingInput } from "./policy.ts";

type BookingStatus = "confirmed" | "cancelled";
type BookingRow = {
  id: string;
  create_request_id: string;
  room_id: string;
  starts_at: string;
  ends_at: string;
  cancel_token_hash: string;
  status: BookingStatus;
  is_demo: number;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};
type RoomRow = { id: string; code: string; name: string; floor_id: string; is_demo: number; reservable: number; archived_at: string | null };
export type BookingPublic = { id: string; roomId: string; startsAt: string; endsAt: string; status: BookingStatus; isDemo: true };
export type BookingAdmin = BookingPublic & { createdAt: string; cancelledAt: string | null; roomCode: string };
export type BusySpan = { startTime: string; endTime: string; kind: "class" | "booking" };
export type FreeSpan = { startTime: string; endTime: string };
export type BookingFailure = "validation" | "not_found" | "room_not_reservable" | "time_conflict" | "request_id_reused" | "booking_ended";
export type BookResult = { ok: true; booking: BookingPublic; replayed: boolean } | { ok: false; reason: BookingFailure; message?: string };
export type CancelResult = { ok: true; booking: BookingPublic } | { ok: false; reason: "not_found" | "booking_ended" };

const hashToken = (token: string): string => createHash("sha256").update(token, "utf8").digest("hex");
function equalHash(a: string, b: string): boolean {
  if (!/^[a-f0-9]{64}$/.test(a) || !/^[a-f0-9]{64}$/.test(b)) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
function publicBooking(row: BookingRow): BookingPublic {
  return { id: row.id, roomId: row.room_id, startsAt: row.starts_at, endsAt: row.ends_at, status: row.status, isDemo: true };
}

/** Shared occupancy check; must also be called from Ali's class-session mutations. */
export function bookingConflict(db: Db, roomId: string, startsAt: string, endsAt: string) {
  return db.prepare<[string, string, string], { id: string; startsAt: string; endsAt: string }>(
    `SELECT id, starts_at AS startsAt, ends_at AS endsAt FROM room_bookings
     WHERE room_id = ? AND status = 'confirmed' AND starts_at < ? AND ends_at > ?
     ORDER BY starts_at LIMIT 1`,
  ).get(roomId, endsAt, startsAt) ?? null;
}

export function createBookingRepository(db: Db, clock: () => Date = () => new Date()) {
  const readRoom = db.prepare<[string], RoomRow>("SELECT id, code, name, floor_id, is_demo, reservable, archived_at FROM rooms WHERE id = ?");
  const readRequest = db.prepare<[string], BookingRow>("SELECT * FROM room_bookings WHERE create_request_id = ?");
  const readBooking = db.prepare<[string], BookingRow>("SELECT * FROM room_bookings WHERE id = ?");
  const readClassCollision = db.prepare<[string, string, string], { id: string }>(
    "SELECT id FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? LIMIT 1",
  );
  const readBookings = db.prepare<[string, string, string], BookingRow>(
    "SELECT * FROM room_bookings WHERE room_id = ? AND status = 'confirmed' AND starts_at < ? AND ends_at > ? ORDER BY starts_at",
  );
  const readClasses = db.prepare<[string, string, string], { starts_at: string; ends_at: string }>(
    "SELECT starts_at, ends_at FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? ORDER BY starts_at",
  );

  function create(input: BookingInput): BookResult {
    // Immediate write lock makes overlap check + insert atomic across processes.
    return db.transaction((): BookResult => {
      const now = clock();
      const checked = validatePeriod(input.date, input.startTime, input.endTime, now);
      const tokenHash = hashToken(input.cancelToken);
      const prior = readRequest.get(input.requestId);
      // A valid request retry is allowed even if the original booking was subsequently cancelled.
      if (prior) {
        // Retry remains idempotent even after the original time has passed.
        const samePeriod = {
          startsAt: berlinLocalToUtcIso(`${input.date}T${input.startTime}`),
          endsAt: berlinLocalToUtcIso(`${input.date}T${input.endTime}`),
        };
        if (prior.room_id === input.roomId && prior.starts_at === samePeriod.startsAt && prior.ends_at === samePeriod.endsAt && equalHash(prior.cancel_token_hash, tokenHash)) {
          return { ok: true, booking: publicBooking(prior), replayed: true };
        }
        return { ok: false, reason: "request_id_reused" };
      }
      if (!checked.ok) return { ok: false, reason: "validation", message: checked.message };
      const { startsAt, endsAt } = checked.period;
      const room = readRoom.get(input.roomId);
      if (!room || room.archived_at || room.reservable !== 1 || !isDemoBookableRoom(room.code)) return { ok: false, reason: "room_not_reservable" };
      if (readClassCollision.get(input.roomId, endsAt, startsAt) || bookingConflict(db, input.roomId, startsAt, endsAt)) {
        return { ok: false, reason: "time_conflict" };
      }
      const id = randomUUID();
      const iso = now.toISOString();
      db.prepare(
        `INSERT INTO room_bookings
        (id, create_request_id, room_id, starts_at, ends_at, cancel_token_hash, status, is_demo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 1, ?, ?)`,
      ).run(id, input.requestId, input.roomId, startsAt, endsAt, tokenHash, iso, iso);
      return { ok: true, booking: publicBooking(readBooking.get(id)!), replayed: false };
    }).immediate();
  }

  function cancel(id: string, token: string): CancelResult {
    return db.transaction((): CancelResult => {
      const booking = readBooking.get(id);
      if (!booking || !equalHash(booking.cancel_token_hash, hashToken(token))) return { ok: false, reason: "not_found" };
      if (booking.status === "cancelled") return { ok: true, booking: publicBooking(booking) };
      const now = clock().toISOString();
      if (booking.ends_at <= now) return { ok: false, reason: "booking_ended" };
      db.prepare("UPDATE room_bookings SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
      return { ok: true, booking: publicBooking(readBooking.get(id)!) };
    }).immediate();
  }

  function cancelByAdmin(id: string): CancelResult {
    return db.transaction((): CancelResult => {
      const booking = readBooking.get(id);
      if (!booking) return { ok: false, reason: "not_found" };
      if (booking.status === "cancelled") return { ok: true, booking: publicBooking(booking) };
      const now = clock().toISOString();
      if (booking.ends_at <= now) return { ok: false, reason: "booking_ended" };
      db.prepare("UPDATE room_bookings SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
      return { ok: true, booking: publicBooking(readBooking.get(id)!) };
    }).immediate();
  }

  function listAdmin(from: string, to: string, roomId?: string): BookingAdmin[] {
    const rows = db.prepare<[string, string, string | null, string | null], BookingRow & { room_code: string }>(
      `SELECT b.*, r.code AS room_code FROM room_bookings b JOIN rooms r ON r.id = b.room_id
       WHERE b.starts_at >= ? AND b.starts_at < ? AND (? IS NULL OR b.room_id = ?)
       ORDER BY b.starts_at DESC LIMIT 500`,
    ).all(from, to, roomId ?? null, roomId ?? null);
    return rows.map((b) => ({ ...publicBooking(b), createdAt: b.created_at, cancelledAt: b.cancelled_at, roomCode: b.room_code }));
  }

  function availability(roomId: string, date: string) {
    const now = clock();
    if (!isBookingDateInRange(date, now)) return { ok: false as const, reason: "validation" as const };
    const room = readRoom.get(roomId);
    if (!room || room.archived_at || room.reservable !== 1 || !isDemoBookableRoom(room.code)) return { ok: false as const, reason: "room_not_reservable" as const };
    const startsAt = berlinLocalToUtcIso(`${date}T${BOOKING_POLICY.opens}`)!;
    const endsAt = berlinLocalToUtcIso(`${date}T${BOOKING_POLICY.closes}`)!;
    const windowStart = Date.parse(startsAt);
    const windowEnd = Date.parse(endsAt);
    const busy: BusySpan[] = [
      ...readClasses.all(roomId, endsAt, startsAt).map((x) => ({ startsAt: x.starts_at, endsAt: x.ends_at, kind: "class" as const })),
      ...readBookings.all(roomId, endsAt, startsAt).map((x) => ({ startsAt: x.starts_at, endsAt: x.ends_at, kind: "booking" as const })),
    ].map((span) => {
      const start = utcIsoToBerlinLocal(new Date(Math.max(windowStart, Date.parse(span.startsAt))).toISOString()).slice(11);
      const end = utcIsoToBerlinLocal(new Date(Math.min(windowEnd, Date.parse(span.endsAt))).toISOString()).slice(11);
      return { startTime: start, endTime: end, kind: span.kind };
    }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    const opening = hhmmToMinutes(BOOKING_POLICY.opens)!;
    const closing = hhmmToMinutes(BOOKING_POLICY.closes)!;
    // Don't advertise starting slots in the past (round up to the next 15-minute mark).
    const earliestInstant = Math.max(windowStart, now.getTime());
    const earliestBerlin = utcIsoToBerlinLocal(new Date(earliestInstant).toISOString());
    const currentMin = earliestBerlin.startsWith(date) ? hhmmToMinutes(earliestBerlin.slice(11))! : closing;
    const fractionalMinute = earliestInstant % 60_000 !== 0 ? 1 : 0;
    let cursor = Math.max(opening, Math.ceil((currentMin + fractionalMinute) / BOOKING_POLICY.minuteStep) * BOOKING_POLICY.minuteStep);
    const free: FreeSpan[] = [];
    for (const b of busy) {
      const bStart = hhmmToMinutes(b.startTime)!;
      const bEnd = hhmmToMinutes(b.endTime)!;
      if (bStart > cursor) free.push({ startTime: minutesToHhmm(cursor), endTime: minutesToHhmm(bStart) });
      cursor = Math.max(cursor, bEnd);
    }
    if (cursor < closing) free.push({ startTime: minutesToHhmm(cursor), endTime: minutesToHhmm(closing) });
    return { ok: true as const, room: { id: room.id, code: room.code, name: room.name, floorId: room.floor_id, isDemo: room.is_demo === 1 }, busy, free };
  }

  return { create, cancel, cancelByAdmin, listAdmin, availability };
}

export type BookingRepository = ReturnType<typeof createBookingRepository>;
