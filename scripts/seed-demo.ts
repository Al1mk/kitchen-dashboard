// Usage: npm run db:seed-demo
// Opt-in and non-destructive: inserts a few clearly labelled demo announcements
// only if they do not exist yet (fixed ids). Never deletes or resets data.
import { resolve } from "node:path";
import { openDatabase } from "../src/lib/db/database.ts";
import type { AnnouncementContent } from "../src/lib/announcements/schema.ts";

const dbPath = resolve(process.env.CAMPUS_BOARD_DB_PATH ?? "data/campus-board.sqlite");

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
db.close();
console.log(`Demo-Inhalte: ${added} neu angelegt, ${DEMO.length - added} bereits vorhanden. Datenbank: ${dbPath}`);
