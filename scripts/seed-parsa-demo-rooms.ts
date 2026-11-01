/** Parsa+Aryan 21-room DEMO manifest. All permissions are hypothetical for the HCI prototype.
 * Only use against an isolated disposable demonstration DB, never official university DB.
 * K1-114 has no pin in Aryan's illustration (location intentionally not fabricated).
 */
import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import { getDatabasePath } from "../src/lib/config.ts";
import { openDatabase } from "../src/lib/db/database.ts";

nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", { info: () => {}, error: console.error });
// The allowed types are defined in src/lib/rooms/schema.ts. Room names come
// from Aryan's map catalogue, except K1-114 from the user-provided campus plan.
const rooms = [
  { code: "K1-103", name: "Seminarraum 1", floorId: "1OG", nameEn: "Seminar room 1", type: "seminar" },
  { code: "K1-114", name: "Rapid Prototyping", floorId: "1OG", nameEn: "Rapid Prototyping", type: "lab" },
  { code: "K1-119", name: "Media Lab", floorId: "1OG", nameEn: "Media Lab", type: "lab" },
  { code: "K1-112", name: "Maschinenraum", floorId: "1OG", nameEn: "Machine room", type: "lab" },
  { code: "K1-121", name: "Elektronik-Werkstatt", floorId: "1OG", nameEn: "Electronics workshop", type: "lab" },
  { code: "K1-120", name: "Seminarraum", floorId: "1OG", nameEn: "Seminar room", type: "seminar" },
  { code: "K1-125", name: "Seminarraum", floorId: "1OG", nameEn: "Seminar room", type: "seminar" },
  { code: "K1-218", name: "Projektraum", floorId: "2OG", nameEn: "Project room", type: "seminar" },
  { code: "K1-217", name: "Testmethodenlabor", floorId: "2OG", nameEn: "Testing methods lab", type: "lab" },
  { code: "K1-216", name: "Modellstadt V2X", floorId: "2OG", nameEn: "Model city V2X", type: "lab" },
  { code: "K1-207", name: "Besprechungsraum", floorId: "2OG", nameEn: "Meeting room", type: "office" },
  { code: "K1-210", name: "Seminarraum", floorId: "2OG", nameEn: "Seminar room", type: "seminar" },
  { code: "K1-206", name: "Büro 3", floorId: "2OG", nameEn: "Office 3", type: "office" },
  { code: "K1-204", name: "Büro 2", floorId: "2OG", nameEn: "Office 2", type: "office" },
  { code: "K1-211", name: "Büro 1", floorId: "2OG", nameEn: "Office 1", type: "office" },
  { code: "K1-301", name: "Büro 1", floorId: "3OG", nameEn: "Office 1", type: "office" },
  { code: "K1-302", name: "Besprechung", floorId: "3OG", nameEn: "Meeting room", type: "office" },
  { code: "K1-303", name: "Seminarraum 8", floorId: "3OG", nameEn: "Seminar room 8", type: "seminar" },
  { code: "K1-307", name: "Seminarraum 7", floorId: "3OG", nameEn: "Seminar room 7", type: "seminar" },
  { code: "K1-305", name: "Büro 2", floorId: "3OG", nameEn: "Office 2", type: "office" },
  { code: "K1-306", name: "Büro 3", floorId: "3OG", nameEn: "Office 3", type: "office" },
 ] as const;
const db = openDatabase(getDatabasePath());
const now = new Date().toISOString();
const getExisting = db.prepare<[string], { id: string; is_demo: number; reservable: number }>("SELECT id, is_demo, reservable FROM rooms WHERE code = ? COLLATE NOCASE");
const updateDemo = db.prepare<[string, string]>("UPDATE rooms SET reservable = 1, updated_at = ? WHERE id = ? AND is_demo = 1");
const insert = db.prepare(`INSERT INTO rooms
  (id, code, name, floor_id, type, description, reservable, is_demo, name_en, description_en, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`);
let added = 0, reenabled = 0, skippedOfficial = 0, alreadyReady = 0;
for (const r of rooms) {
  const old = getExisting.get(r.code);
  if (old) {
    if (old.is_demo !== 1) { console.warn(`OFFICIAL/UNMARKED ROW ${r.code}: NOT MODIFIED. Ask Ali to review reservable flag in admin.`); skippedOfficial++; }
    else if (old.reservable === 0) { updateDemo.run(now, old.id); reenabled++; }
    else alreadyReady++;
    continue;
  }
  insert.run(randomUUID(), r.code, r.name, r.floorId, r.type,
    "DEMO: Name aus Aryans illustrativem Raumkatalog (K1-114 aus separatem Campusplan). Buchbarkeit nur hypothetisch, keine offizielle Raumfreigabe.",
    r.nameEn, "DEMO: assumed bookable for prototype only; not an official university booking.", now, now);
  added++;
}
console.log(`Parsa 21 rooms: new=${added}, reenabled_demo=${reenabled}, previously_demo=${alreadyReady}, unchanged_real=${skippedOfficial}.`);
console.log("Important: only is_demo=1 rooms may be automatically changed. Real room flags require admin approval.");
db.close();
