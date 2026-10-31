import { randomUUID } from "node:crypto";
import type { Db } from "../db/database.ts";
import { upcomingOccupancy } from "../occupancy/conflicts.ts";
import { compareRoomCodes, FLOOR_IDS, type FloorId, type PublicRoom, type RoomContent, type RoomType } from "./schema.ts";

/** Admin view of one room. */
export type AdminRoom = RoomContent & {
  id: string;
  isDemo: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Scheduled (not cancelled) sessions in this room that have not ended yet. */
  upcomingSessions: number;
};

type Row = {
  id: string;
  code: string;
  name: string;
  floor_id: string;
  type: string;
  description: string;
  reservable: number;
  name_en: string;
  description_en: string;
  is_demo: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoomWriteResult = { ok: true; room: AdminRoom } | { ok: false; reason: "not_found" | "duplicate_code" | "booking_in_use" };
export type ArchiveResult =
  | { ok: true; room: AdminRoom }
  | { ok: false; reason: "not_found" | "already_archived" }
  | { ok: false; reason: "in_use"; upcomingSessions: number; upcomingBookings: number };
export type RestoreResult = { ok: true; room: AdminRoom } | { ok: false; reason: "not_found" | "not_archived" };

const floorOrder = (id: string) => FLOOR_IDS.indexOf(id as FloorId);

function compareRooms(a: { floorId: string; code: string }, b: { floorId: string; code: string }) {
  return floorOrder(a.floorId) - floorOrder(b.floorId) || compareRoomCodes(a.code, b.code);
}

export function createRoomRepository(db: Db, clock: () => Date = () => new Date()) {
  const selectOne = db.prepare<[string], Row>("SELECT * FROM rooms WHERE id = ?");
  const selectAll = db.prepare<[], Row>("SELECT * FROM rooms");
  const selectActive = db.prepare<[], Row>("SELECT * FROM rooms WHERE archived_at IS NULL");
  const selectCodeOwner = db.prepare<[string], { id: string }>("SELECT id FROM rooms WHERE code = ?");

  function toAdmin(row: Row): AdminRoom {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      floorId: row.floor_id as FloorId,
      type: row.type as RoomType,
      description: row.description,
      reservable: row.reservable === 1,
      nameEn: row.name_en,
      descriptionEn: row.description_en,
      isDemo: row.is_demo === 1,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      upcomingSessions: upcomingOccupancy(db, row.id, clock().toISOString()).sessions,
    };
  }

  function get(id: string): AdminRoom | null {
    const row = selectOne.get(id);
    return row ? toAdmin(row) : null;
  }

  /** Room codes are unique regardless of letter case (column uses COLLATE NOCASE). */
  function codeTaken(code: string, exceptId?: string) {
    const owner = selectCodeOwner.get(code);
    return !!owner && owner.id !== exceptId;
  }

  return {
    get,

    list({ includeArchived }: { includeArchived: boolean }): AdminRoom[] {
      return (includeArchived ? selectAll : selectActive).all().map(toAdmin).sort(compareRooms);
    },

    create(content: RoomContent, options: { isDemo?: boolean } = {}): RoomWriteResult {
      return db.transaction((): RoomWriteResult => {
        if (codeTaken(content.code)) return { ok: false, reason: "duplicate_code" };
        const id = randomUUID();
        const now = clock().toISOString();
        db.prepare(
          `INSERT INTO rooms (id, code, name, floor_id, type, description, reservable, name_en, description_en, is_demo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          content.code,
          content.name,
          content.floorId,
          content.type,
          content.description,
          content.reservable ? 1 : 0,
          content.nameEn,
          content.descriptionEn,
          options.isDemo ? 1 : 0,
          now,
          now,
        );
        return { ok: true, room: get(id)! };
      }).immediate();
    },

    /** Changes take effect publicly at once. Sessions keep pointing to the same room id. */
    update(id: string, content: RoomContent): RoomWriteResult {
      return db.transaction((): RoomWriteResult => {
        const current = selectOne.get(id);
        if (!current) return { ok: false, reason: "not_found" };
        if (current.reservable === 1 && !content.reservable && upcomingOccupancy(db, id, clock().toISOString()).bookings > 0) {
          return { ok: false, reason: "booking_in_use" };
        }
        if (codeTaken(content.code, id)) return { ok: false, reason: "duplicate_code" };
        db.prepare(
          `UPDATE rooms SET code = ?, name = ?, floor_id = ?, type = ?, description = ?, reservable = ?, name_en = ?, description_en = ?, updated_at = ?
           WHERE id = ?`,
        ).run(
          content.code,
          content.name,
          content.floorId,
          content.type,
          content.description,
          content.reservable ? 1 : 0,
          content.nameEn,
          content.descriptionEn,
          clock().toISOString(),
          id,
        );
        return { ok: true, room: get(id)! };
      }).immediate();
    },

    /**
     * Hides the room from the public directory and from new sessions. Refused
     * while scheduled sessions are still ahead, so nothing points silently to
     * a room that no longer appears. Past sessions keep their reference.
     */
    archive(id: string): ArchiveResult {
      return db.transaction((): ArchiveResult => {
        const row = selectOne.get(id);
        if (!row) return { ok: false, reason: "not_found" };
        if (row.archived_at) return { ok: false, reason: "already_archived" };
        const now = clock().toISOString();
        const upcoming = upcomingOccupancy(db, id, now);
        if (upcoming.sessions + upcoming.bookings > 0) {
          return { ok: false, reason: "in_use", upcomingSessions: upcoming.sessions, upcomingBookings: upcoming.bookings };
        }
        db.prepare("UPDATE rooms SET archived_at = ?, updated_at = ? WHERE id = ?").run(now, now, id);
        return { ok: true, room: get(id)! };
      }).immediate();
    },

    restore(id: string): RestoreResult {
      return db.transaction((): RestoreResult => {
        const row = selectOne.get(id);
        if (!row) return { ok: false, reason: "not_found" };
        if (!row.archived_at) return { ok: false, reason: "not_archived" };
        db.prepare("UPDATE rooms SET archived_at = NULL, updated_at = ? WHERE id = ?").run(clock().toISOString(), id);
        return { ok: true, room: get(id)! };
      }).immediate();
    },

    /** Active rooms only, allowlisted fields, ordered by floor and natural code order. */
    listPublic(): PublicRoom[] {
      return selectActive
        .all()
        .map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          floorId: row.floor_id as FloorId,
          type: row.type as RoomType,
          description: row.description,
          reservable: row.reservable === 1,
          isDemo: row.is_demo === 1,
          nameEn: row.name_en || null,
          descriptionEn: row.description_en || null,
        }))
        .sort(compareRooms);
    },
  };
}

export type RoomRepository = ReturnType<typeof createRoomRepository>;
