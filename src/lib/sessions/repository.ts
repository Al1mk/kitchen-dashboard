import { randomUUID } from "node:crypto";
import type { Db } from "../db/database.ts";
import type { FloorId } from "../rooms/schema.ts";
import { berlinDayRange } from "../time/berlin.ts";
import type { PublicSession, SessionContent, SessionStatus } from "./schema.ts";

/** Admin view of one class session, with its room resolved by stable id. */
export type AdminClassSession = SessionContent & {
  id: string;
  status: SessionStatus;
  cancelledAt: string | null;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  room: { id: string; code: string; name: string; floorId: FloorId; archived: boolean };
};

export type SessionConflict = { id: string; title: string; startsAt: string; endsAt: string };

type Row = {
  id: string;
  title: string;
  instructor: string;
  cohort: string;
  term: string;
  room_id: string;
  starts_at: string;
  ends_at: string;
  status: SessionStatus;
  cancelled_at: string | null;
  is_demo: number;
  created_at: string;
  updated_at: string;
  room_code: string;
  room_name: string;
  room_floor_id: string;
  room_archived_at: string | null;
};

type RoomCheckFailure = { ok: false; reason: "room_not_found" | "room_archived" };
type ConflictFailure = { ok: false; reason: "conflict"; conflict: SessionConflict };

export type SessionWriteResult = { ok: true; session: AdminClassSession } | { ok: false; reason: "not_found" } | RoomCheckFailure | ConflictFailure;
export type CancelResult = { ok: true; session: AdminClassSession } | { ok: false; reason: "not_found" | "not_scheduled" };
export type ReinstateResult =
  | { ok: true; session: AdminClassSession }
  | { ok: false; reason: "not_found" | "not_cancelled" }
  | RoomCheckFailure
  | ConflictFailure;

const SELECT = `
  SELECT s.*, r.code AS room_code, r.name AS room_name, r.floor_id AS room_floor_id, r.archived_at AS room_archived_at
  FROM class_sessions s JOIN rooms r ON r.id = s.room_id`;

export function createSessionRepository(db: Db, clock: () => Date = () => new Date()) {
  const selectOne = db.prepare<[string], Row>(`${SELECT} WHERE s.id = ?`);
  const selectByRequest = db.prepare<[string], { id: string }>("SELECT id FROM class_sessions WHERE create_request_id = ?");
  const selectRange = db.prepare<[string, string], Row>(`${SELECT} WHERE s.starts_at >= ? AND s.starts_at < ? ORDER BY s.starts_at, r.code`);
  const selectRoomRange = db.prepare<[string, string, string], Row>(
    `${SELECT} WHERE s.starts_at >= ? AND s.starts_at < ? AND s.room_id = ? ORDER BY s.starts_at, r.code`,
  );
  const selectRoom = db.prepare<[string], { archived_at: string | null }>("SELECT archived_at FROM rooms WHERE id = ?");
  // Half-open intervals: a session ending at 09:30 does not clash with one starting at 09:30.
  const selectOverlap = db.prepare<[string, string, string, string], SessionConflict>(
    `SELECT id, title, starts_at AS startsAt, ends_at AS endsAt FROM class_sessions
     WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? AND id != ?
     ORDER BY starts_at LIMIT 1`,
  );

  function toAdmin(row: Row): AdminClassSession {
    return {
      id: row.id,
      title: row.title,
      instructor: row.instructor,
      cohort: row.cohort,
      term: row.term,
      roomId: row.room_id,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      status: row.status,
      cancelledAt: row.cancelled_at,
      isDemo: row.is_demo === 1,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      room: { id: row.room_id, code: row.room_code, name: row.room_name, floorId: row.room_floor_id as FloorId, archived: !!row.room_archived_at },
    };
  }

  function get(id: string): AdminClassSession | null {
    const row = selectOne.get(id);
    return row ? toAdmin(row) : null;
  }

  /** A room may be (re)assigned only while it is active; an unchanged archived room is kept. */
  function checkRoom(roomId: string, currentRoomId?: string): RoomCheckFailure | null {
    const room = selectRoom.get(roomId);
    if (!room) return { ok: false, reason: "room_not_found" };
    if (room.archived_at && roomId !== currentRoomId) return { ok: false, reason: "room_archived" };
    return null;
  }

  function findConflict(roomId: string, startsAt: string, endsAt: string, exceptId = ""): ConflictFailure | null {
    const conflict = selectOverlap.get(roomId, endsAt, startsAt, exceptId);
    return conflict ? { ok: false, reason: "conflict", conflict } : null;
  }

  return {
    get,

    /** Sessions starting in [from, to) (UTC ISO), optionally for one room. */
    list({ from, to, roomId }: { from: string; to: string; roomId?: string }): AdminClassSession[] {
      return (roomId ? selectRoomRange.all(from, to, roomId) : selectRange.all(from, to)).map(toAdmin);
    },

    /** Creates a scheduled session. Room checks and the overlap check run in one transaction. */
    create(content: SessionContent, requestId?: string, options: { isDemo?: boolean } = {}): SessionWriteResult {
      return db.transaction((): SessionWriteResult => {
        if (requestId) {
          const existing = selectByRequest.get(requestId);
          if (existing) return { ok: true, session: get(existing.id)! };
        }
        const failure = checkRoom(content.roomId) ?? findConflict(content.roomId, content.startsAt, content.endsAt);
        if (failure) return failure;
        const id = randomUUID();
        const now = clock().toISOString();
        db.prepare(
          `INSERT INTO class_sessions
             (id, create_request_id, title, instructor, cohort, term, room_id, starts_at, ends_at, status, is_demo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?, ?)`,
        ).run(id, requestId ?? null, content.title, content.instructor, content.cohort, content.term, content.roomId, content.startsAt, content.endsAt, options.isDemo ? 1 : 0, now, now);
        return { ok: true, session: get(id)! };
      })();
    },

    /** Saves changes; they are public immediately. Cancelled sessions stay cancelled. */
    update(id: string, content: SessionContent): SessionWriteResult {
      return db.transaction((): SessionWriteResult => {
        const current = selectOne.get(id);
        if (!current) return { ok: false, reason: "not_found" };
        const failure =
          checkRoom(content.roomId, current.room_id) ??
          (current.status === "scheduled" ? findConflict(content.roomId, content.startsAt, content.endsAt, id) : null);
        if (failure) return failure;
        db.prepare(
          `UPDATE class_sessions
           SET title = ?, instructor = ?, cohort = ?, term = ?, room_id = ?, starts_at = ?, ends_at = ?, updated_at = ?
           WHERE id = ?`,
        ).run(content.title, content.instructor, content.cohort, content.term, content.roomId, content.startsAt, content.endsAt, clock().toISOString(), id);
        return { ok: true, session: get(id)! };
      })();
    },

    /** Marks the session as cancelled. It stays visible publicly, labelled "Entfällt". */
    cancel(id: string): CancelResult {
      return db.transaction((): CancelResult => {
        const current = selectOne.get(id);
        if (!current) return { ok: false, reason: "not_found" };
        if (current.status !== "scheduled") return { ok: false, reason: "not_scheduled" };
        const now = clock().toISOString();
        db.prepare("UPDATE class_sessions SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
        return { ok: true, session: get(id)! };
      })();
    },

    /** Undoes a cancellation if the room is still active and free. */
    reinstate(id: string): ReinstateResult {
      return db.transaction((): ReinstateResult => {
        const current = selectOne.get(id);
        if (!current) return { ok: false, reason: "not_found" };
        if (current.status !== "cancelled") return { ok: false, reason: "not_cancelled" };
        if (current.room_archived_at) return { ok: false, reason: "room_archived" };
        const conflict = findConflict(current.room_id, current.starts_at, current.ends_at, id);
        if (conflict) return conflict;
        db.prepare("UPDATE class_sessions SET status = 'scheduled', cancelled_at = NULL, updated_at = ? WHERE id = ?").run(clock().toISOString(), id);
        return { ok: true, session: get(id)! };
      })();
    },

    /** Public schedule of one Berlin calendar day, cancelled sessions included. */
    listPublicDay(date: string, roomId?: string): PublicSession[] {
      const { start, end } = berlinDayRange(date);
      const rows = roomId ? selectRoomRange.all(start, end, roomId) : selectRange.all(start, end);
      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        instructor: row.instructor,
        cohort: row.cohort,
        term: row.term,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        room: { id: row.room_id, code: row.room_code, name: row.room_name, floorId: row.room_floor_id as FloorId },
        isDemo: row.is_demo === 1,
      }));
    },
  };
}

export type SessionRepository = ReturnType<typeof createSessionRepository>;
