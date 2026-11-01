import type { Db } from "../db/database.ts";

// One occupancy invariant for rooms (docs/contracts.md C6): a scheduled class
// or a confirmed booking occupies its room for a half-open interval. Every
// mutation that can add occupancy calls findOccupant inside its own
// BEGIN IMMEDIATE transaction on the same connection, so check and write are
// atomic across processes. Cancelled classes/bookings never block.

export type Period = { startsAt: string; endsAt: string };

export type Occupant =
  | { kind: "class"; id: string; title: string; startsAt: string; endsAt: string }
  | { kind: "booking"; id: string; startsAt: string; endsAt: string };

/** Half-open: [10:00, 11:00) and [11:00, 12:00) do not overlap. ISO UTC strings compare lexically. */
export function overlaps(a: Period, b: Period): boolean {
  return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}

type Statements = {
  classOverlap: ReturnType<typeof prepareClassOverlap>;
  bookingOverlap: ReturnType<typeof prepareBookingOverlap>;
  upcomingClasses: ReturnType<typeof prepareCount>;
  upcomingBookings: ReturnType<typeof prepareCount>;
};

const prepareClassOverlap = (db: Db) =>
  db.prepare<[string, string, string, string], { id: string; title: string; startsAt: string; endsAt: string }>(
    `SELECT id, title, starts_at AS startsAt, ends_at AS endsAt FROM class_sessions
     WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? AND id != ?
     ORDER BY starts_at LIMIT 1`,
  );
const prepareBookingOverlap = (db: Db) =>
  db.prepare<[string, string, string], { id: string; startsAt: string; endsAt: string }>(
    `SELECT id, starts_at AS startsAt, ends_at AS endsAt FROM room_bookings
     WHERE room_id = ? AND status = 'confirmed' AND starts_at < ? AND ends_at > ?
     ORDER BY starts_at LIMIT 1`,
  );
const prepareCount = (db: Db, sql: string) => db.prepare<[string, string], { n: number }>(sql);

const cache = new WeakMap<Db, Statements>();
function statements(db: Db): Statements {
  let s = cache.get(db);
  if (!s) {
    s = {
      classOverlap: prepareClassOverlap(db),
      bookingOverlap: prepareBookingOverlap(db),
      upcomingClasses: prepareCount(db, "SELECT COUNT(*) AS n FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND ends_at > ?"),
      upcomingBookings: prepareCount(db, "SELECT COUNT(*) AS n FROM room_bookings WHERE room_id = ? AND status = 'confirmed' AND ends_at > ?"),
    };
    cache.set(db, s);
  }
  return s;
}

/**
 * The first scheduled class or confirmed booking overlapping `period` in the
 * room, or null. `exceptClassId` excludes the class being edited/reinstated.
 * Must run inside the caller's write transaction.
 */
export function findOccupant(db: Db, roomId: string, period: Period, exceptClassId = ""): Occupant | null {
  const s = statements(db);
  const cls = s.classOverlap.get(roomId, period.endsAt, period.startsAt, exceptClassId);
  if (cls) return { kind: "class", ...cls };
  const booking = s.bookingOverlap.get(roomId, period.endsAt, period.startsAt);
  return booking ? { kind: "booking", ...booking } : null;
}

/** Scheduled classes and confirmed bookings in the room that have not ended at `nowIso`. */
export function upcomingOccupancy(db: Db, roomId: string, nowIso: string): { sessions: number; bookings: number } {
  const s = statements(db);
  return { sessions: s.upcomingClasses.get(roomId, nowIso)!.n, bookings: s.upcomingBookings.get(roomId, nowIso)!.n };
}
