// Usage: CAMPUS_BOARD_DB_PATH=.demo-data/team-demo.sqlite npm run db:seed-team-demo -- --yes
//
// Opt-in seed for the integrated team demo (docs/contracts.md C2): the 48 map
// catalog rooms with fixed ids and a few labelled demo sessions. Only for an
// explicitly named disposable database: it refuses to run without
// CAMPUS_BOARD_DB_PATH and --yes, and refuses the default data/ database.
// Never deletes, resets, revives or re-flags existing records.
import { existsSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { openDatabase } from "../src/lib/db/database.ts";
import { seedTeamDemo } from "../src/lib/map/team-seed.ts";

const configured = process.env.CAMPUS_BOARD_DB_PATH;
if (!configured) {
  console.error("STOP: set CAMPUS_BOARD_DB_PATH to a disposable demo database (e.g. .demo-data/team-demo.sqlite).");
  process.exit(1);
}
const dbPath = resolve(configured);
const realDataDir = resolve("data");
const fromData = relative(realDataDir, dbPath);
if (fromData === "" || (!fromData.startsWith("..") && !isAbsolute(fromData))) {
  console.error(`STOP: ${dbPath} is inside data/ (the real database directory). Use a separate demo database.`);
  process.exit(1);
}
if (!process.argv.includes("--yes")) {
  console.error(`Would seed the team demo into ${dbPath}${existsSync(dbPath) ? " (existing file)" : " (new file)"}. Re-run with --yes to confirm.`);
  process.exit(1);
}

const db = openDatabase(dbPath);
const report = seedTeamDemo(db);
db.close();

console.log(`Datenbank: ${dbPath}`);
console.log(`Team-Demo-Räume: ${report.roomsCreated.length} neu, ${report.roomsKept.length} unverändert vorhanden, ${report.archivedKept.length} archiviert (nicht verändert).`);
for (const c of report.collisions) {
  console.log(`KOLLISION: Raumnummer ${c.code} gehört bereits Raum-ID ${c.existingId}; Katalog-ID ${c.catalogId} wurde NICHT angelegt (Kartenposition bleibt ungebunden).`);
}
console.log(`Demo-Termine: ${report.sessionsCreated} neu, ${report.sessionsSkipped} vorhanden oder übersprungen (Raum belegt/archiviert).`);
