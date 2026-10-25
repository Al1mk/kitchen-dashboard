// Usage: npm run db:seed-demo
// Opt-in and non-destructive: inserts clearly labelled demo announcements, rooms
// and one week of class sessions
// only if they do not exist yet (fixed ids). Never deletes or resets data.
// Some demo records have an English version, some only part of one, some none,
// so the English interface's fallback can be seen. Records that already exist
// are not changed (no English text is added to them).
import nextEnv from "@next/env";
import { getDatabasePath } from "../src/lib/config.ts";
import { openDatabase } from "../src/lib/db/database.ts";
import type { AnnouncementContent } from "../src/lib/announcements/schema.ts";
import type { FloorId, RoomType } from "../src/lib/rooms/schema.ts";
import { termForDate } from "../src/lib/sessions/schema.ts";
import { addDays, berlinDateOf, berlinLocalToUtcIso } from "../src/lib/time/berlin.ts";

// Load .env files exactly like `next dev` (or `next start` with NODE_ENV=production),
// so the demo data lands in the same database the app uses.
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
const dbPath = getDatabasePath();

const DEMO: { id: string; publish: boolean; content: AnnouncementContent }[] = [
  {
    id: "demo-willkommen",
    publish: true,
    content: {
      title: "Willkommen am Lucas-Cranach-Campus (Demo)",
      body: "Beispielinhalt für den Prototyp: Hier erscheinen Mitteilungen, die in der Verwaltung veröffentlicht wurden.",
      category: "general",
      pinned: true,
      startsAt: null,
      endsAt: null,
      titleEn: "Welcome to Lucas-Cranach-Campus (Demo)",
      bodyEn: "Sample content for the prototype: announcements published in the admin area appear here.",
    },
  },
  {
    id: "demo-spieleabend",
    publish: true,
    content: {
      title: "Spieleabend in der Küche (Demo)",
      body: "Beispielinhalt: Gemeinsamer Spieleabend – Datum und Ort sind erfunden und dienen nur der Demonstration.",
      category: "event",
      pinned: false,
      startsAt: null,
      endsAt: null,
      titleEn: "Games night in the kitchen (Demo)",
      bodyEn: "", // partial on purpose: the English interface shows the German text here
    },
  },
  {
    id: "demo-entwurf",
    publish: false,
    content: {
      title: "Entwurf: Reinigung der Kühlschränke (Demo)",
      body: "Beispiel-Entwurf. Dieser Text ist nicht veröffentlicht und darf auf dem Bildschirm nicht erscheinen.",
      category: "important",
      pinned: false,
      startsAt: null,
      endsAt: null,
      titleEn: "",
      bodyEn: "",
    },
  },
];

const db = openDatabase(dbPath);
const now = new Date().toISOString();
const insert = db.prepare(
  `INSERT OR IGNORE INTO announcements (id, status, draft_json, published_json, published_at, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
let added = 0;
for (const item of DEMO) {
  const json = JSON.stringify(item.content);
  const info = insert.run(
    item.id,
    item.publish ? "published" : "draft",
    json,
    item.publish ? json : null,
    item.publish ? now : null,
    now,
    now,
  );
  added += info.changes;
}
console.log(`Demo-Mitteilungen: ${added} neu angelegt, ${DEMO.length - added} bereits vorhanden.`);

// Demo rooms: invented codes with a DEMO- prefix so they can never be mistaken
// for official room numbers. is_demo = 1 marks them in admin and public views.
const DEMO_ROOMS: { id: string; code: string; name: string; nameEn?: string; floorId: FloorId; type: RoomType; reservable: boolean }[] = [
  { id: "demo-room-e01", code: "DEMO-E01", name: "Küche / Aufenthalt (Demo)", nameEn: "Kitchen / common room (Demo)", floorId: "EG", type: "common", reservable: false },
  { id: "demo-room-e02", code: "DEMO-E02", name: "Hörsaal A (Demo)", nameEn: "Lecture hall A (Demo)", floorId: "EG", type: "lecture", reservable: false },
  { id: "demo-room-101", code: "DEMO-101", name: "Seminarraum 1 (Demo)", nameEn: "Seminar room 1 (Demo)", floorId: "1OG", type: "seminar", reservable: true },
  { id: "demo-room-102", code: "DEMO-102", name: "PC-Labor (Demo)", floorId: "1OG", type: "lab", reservable: false },
  { id: "demo-room-201", code: "DEMO-201", name: "Gruppenraum (Demo)", floorId: "2OG", type: "study", reservable: true },
  { id: "demo-room-202", code: "DEMO-202", name: "Seminarraum 2 (Demo)", floorId: "2OG", type: "seminar", reservable: false },
];

const insertRoom = db.prepare(
  `INSERT OR IGNORE INTO rooms (id, code, name, floor_id, type, description, reservable, name_en, description_en, is_demo, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
);
let roomsAdded = 0;
for (const r of DEMO_ROOMS) {
  const descriptionEn = r.nameEn ? "Example entry: location and equipment are invented." : "";
  roomsAdded += insertRoom.run(
    r.id,
    r.code,
    r.name,
    r.floorId,
    r.type,
    "Beispieleintrag: Lage und Ausstattung sind erfunden.",
    r.reservable ? 1 : 0,
    r.nameEn ?? "",
    descriptionEn,
    now,
    now,
  ).changes;
}
console.log(`Demo-Räume: ${roomsAdded} neu angelegt, ${DEMO_ROOMS.length - roomsAdded} bereits vorhanden.`);

// Demo sessions for the current Berlin week (Monday–Friday). Ids contain the
// date, so running the script in a later week adds that week as well.
const DEMO_WEEK: { day: number; roomId: string; start: string; end: string; title: string; instructor: string; cancelled?: boolean }[] = [
  { day: 0, roomId: "demo-room-101", start: "08:15", end: "09:45", title: "Einführung in die Wirtschaftsinformatik (Demo)", instructor: "Dozent:in A (Demo)" },
  { day: 0, roomId: "demo-room-e02", start: "10:00", end: "11:30", title: "Mathematik (Demo)", instructor: "Dozent:in B (Demo)" },
  { day: 1, roomId: "demo-room-102", start: "08:15", end: "11:30", title: "Programmierung – Übung (Demo)", instructor: "Dozent:in C (Demo)" },
  { day: 1, roomId: "demo-room-101", start: "13:00", end: "14:30", title: "Mensch-Maschine-Interaktion (Demo)", instructor: "Dozent:in D (Demo)" },
  { day: 2, roomId: "demo-room-e02", start: "08:15", end: "09:45", title: "Betriebswirtschaftslehre (Demo)", instructor: "Dozent:in B (Demo)" },
  { day: 2, roomId: "demo-room-202", start: "10:00", end: "11:30", title: "Englisch (Demo)", instructor: "Dozent:in E (Demo)" },
  { day: 3, roomId: "demo-room-101", start: "10:00", end: "11:30", title: "Mensch-Maschine-Interaktion – Projekt (Demo)", instructor: "Dozent:in D (Demo)" },
  { day: 3, roomId: "demo-room-102", start: "13:00", end: "16:15", title: "Programmierung – Labor (Demo)", instructor: "Dozent:in C (Demo)" },
  { day: 4, roomId: "demo-room-202", start: "08:15", end: "09:45", title: "Statistik (Demo)", instructor: "Dozent:in A (Demo)", cancelled: true },
];

const today = berlinDateOf(new Date());
const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
const monday = addDays(today, -weekday);
const insertSession = db.prepare(
  `INSERT OR IGNORE INTO class_sessions
     (id, title, instructor, cohort, term, room_id, starts_at, ends_at, status, cancelled_at, is_demo, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
);
// Never double-book: skip a demo session if the room is taken or archived by now.
const roomBusy = db.prepare<[string, string, string, string, string]>(
  `SELECT 1 FROM class_sessions WHERE room_id = ? AND status = 'scheduled' AND starts_at < ? AND ends_at > ? AND id != ?
   UNION ALL SELECT 1 FROM rooms WHERE id = ? AND archived_at IS NOT NULL`,
);
let sessionsAdded = 0;
for (const [index, s] of DEMO_WEEK.entries()) {
  const date = addDays(monday, s.day);
  const id = `demo-session-${date}-${index + 1}`;
  const startsAt = berlinLocalToUtcIso(`${date}T${s.start}`)!;
  const endsAt = berlinLocalToUtcIso(`${date}T${s.end}`)!;
  if (!s.cancelled && roomBusy.get(s.roomId, endsAt, startsAt, id, s.roomId)) continue;
  sessionsAdded += insertSession.run(
    id, s.title, s.instructor, "Wirtschaftsinformatik 2.0 – Beispielsemester", termForDate(date), s.roomId, startsAt, endsAt,
    s.cancelled ? "cancelled" : "scheduled", s.cancelled ? now : null, now, now,
  ).changes;
}
console.log(`Demo-Termine (Woche ab ${monday}): ${sessionsAdded} neu angelegt, ${DEMO_WEEK.length - sessionsAdded} bereits vorhanden oder übersprungen.`);

db.close();
console.log(`Datenbank: ${dbPath}`);
