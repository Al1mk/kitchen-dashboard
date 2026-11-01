import type { Db } from "../db/database.ts";
import { parseRoomInput } from "../rooms/schema.ts";
import { termForDate } from "../sessions/schema.ts";
import { addDays, berlinDateOf, berlinLocalToUtcIso } from "../time/berlin.ts";
import { TEAM_DEMO_ROOMS } from "./team-catalog.ts";

// Opt-in team demo seed (docs/contracts.md C2). Adds missing catalog rooms with
// their fixed ids and a few labelled demo sessions. It never changes, revives
// or re-flags an existing row and never guesses an id for an existing code.

export type TeamSeedReport = {
  roomsCreated: string[];
  /** Id already present: left exactly as it is (also when archived or edited). */
  roomsKept: string[];
  archivedKept: string[];
  /** Code already used by a room with another id: skipped, needs an explicit decision. */
  collisions: { code: string; catalogId: string; existingId: string }[];
  sessionsCreated: number;
  sessionsSkipped: number;
};

/**
 * Lecturer of the HCI course of this project, as identified by Ali; name as on
 * https://www.hs-coburg.de/personen/prof-dr-christian-zagel/ . Used only for the
 * HCI demo sessions: their rooms, days and times stay invented demo values.
 */
export const HCI_LECTURER = "Prof. Dr. Christian Zagel";

/** Sample sessions relative to "today" (Berlin): clearly demo, not a real timetable. */
const DEMO_SESSIONS = [
  { day: 0, roomId: "lcc-demo-room-k1-120", start: "10:00", end: "11:30", title: "Mensch-Maschine-Interaktion (Demo)", instructor: HCI_LECTURER },
  { day: 0, roomId: "lcc-demo-room-k1-103", start: "14:00", end: "15:30", title: "Wirtschaftsinformatik – Übung (Demo)", instructor: "Dozent:in B (Demo)" },
  { day: 1, roomId: "lcc-demo-room-k1-120", start: "08:15", end: "09:45", title: "Projektmanagement (Demo)", instructor: "Dozent:in C (Demo)" },
  { day: 1, roomId: "lcc-demo-room-k1-303", start: "12:00", end: "13:30", title: "Statistik (Demo)", instructor: "Dozent:in D (Demo)" },
] as const;

export function seedTeamDemo(db: Db, now: Date = new Date()): TeamSeedReport {
  const report: TeamSeedReport = { roomsCreated: [], roomsKept: [], archivedKept: [], collisions: [], sessionsCreated: 0, sessionsSkipped: 0 };
  const iso = now.toISOString();
  const byId = db.prepare<[string], { id: string; archived_at: string | null }>("SELECT id, archived_at FROM rooms WHERE id = ?");
  const byCode = db.prepare<[string], { id: string }>("SELECT id FROM rooms WHERE code = ?");
  const insertRoom = db.prepare(
    `INSERT INTO rooms (id, code, name, floor_id, type, description, reservable, name_en, description_en, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', ?, ?, '', 1, ?, ?)`,
  );
  const insertSession = db.prepare(
    `INSERT OR IGNORE INTO class_sessions
       (id, title, instructor, cohort, term, room_id, starts_at, ends_at, status, is_demo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1, ?, ?)`,
  );
  // Never double-book: a sample session is skipped if its room is missing,
  // archived, or occupied by a scheduled class or a confirmed booking.
  const blocked = db.prepare<[string, string, string, string, string, string, string, string]>(
    `SELECT 1 FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? AND id != ?
     UNION ALL SELECT 1 FROM room_bookings WHERE room_id = ? AND status = 'confirmed' AND starts_at < ? AND ends_at > ?
     UNION ALL SELECT 1 WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE id = ? AND archived_at IS NULL)`,
  );

  db.transaction(() => {
    for (const entry of TEAM_DEMO_ROOMS) {
      const existing = byId.get(entry.id);
      if (existing) {
        (existing.archived_at ? report.archivedKept : report.roomsKept).push(entry.id);
        continue;
      }
      const owner = byCode.get(entry.code);
      if (owner) {
        report.collisions.push({ code: entry.code, catalogId: entry.id, existingId: owner.id });
        continue;
      }
      const parsed = parseRoomInput({ code: entry.code, name: entry.name, nameEn: entry.nameEn, floorId: entry.floorId, type: entry.type, reservable: entry.initiallyReservable });
      if (!parsed.ok) throw new Error(`Catalog entry ${entry.id} is invalid: ${JSON.stringify(parsed.fieldErrors)}`);
      const c = parsed.content;
      insertRoom.run(entry.id, c.code, c.name, c.floorId, c.type, c.reservable ? 1 : 0, c.nameEn, iso, iso);
      report.roomsCreated.push(entry.id);
    }

    const today = berlinDateOf(now);
    for (const [index, s] of DEMO_SESSIONS.entries()) {
      const date = addDays(today, s.day);
      const id = `lcc-demo-session-${date}-${index + 1}`;
      const startsAt = berlinLocalToUtcIso(`${date}T${s.start}`)!;
      const endsAt = berlinLocalToUtcIso(`${date}T${s.end}`)!;
      if (blocked.get(s.roomId, endsAt, startsAt, id, s.roomId, endsAt, startsAt, s.roomId)) {
        report.sessionsSkipped++;
        continue;
      }
      const changes = insertSession.run(id, s.title, s.instructor, "Beispielsemester (Demo)", termForDate(date), s.roomId, startsAt, endsAt, iso, iso).changes;
      if (changes) report.sessionsCreated++;
      else report.sessionsSkipped++;
    }
  }).immediate();

  return report;
}
