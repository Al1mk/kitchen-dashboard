import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Worker } from "node:worker_threads";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase } from "../../src/lib/db/database.ts";
import { seedTeamDemo } from "../../src/lib/map/team-seed.ts";

// T10/T17: real concurrency. Each competitor is a separate worker thread with
// its own SQLite connection to the same file; all are released at the same
// moment by a shared-memory barrier. Sequential calls in Promise.all would not
// test anything, because better-sqlite3 is synchronous.

const NOW = "2026-11-02T06:00:00.000Z"; // Monday 07:00 Berlin
const ROOM = "lcc-demo-room-k1-120";
const ROUNDS = 6;
let dir: string;
let path: string;
let seq = 0;

const token = (bytes: number) => {
  const b = Buffer.alloc(bytes);
  b.writeUInt32BE(++seq, 0);
  b.writeUInt32BE(process.pid, 4);
  return b.toString("base64url");
};
const bookingJob = (startTime: string, endTime: string) => ({
  kind: "booking" as const,
  input: { roomId: ROOM, date: "2026-11-03", startTime, endTime, requestId: token(16), cancelToken: token(32) },
});
// 2026-11-03 Berlin = UTC+1
const classJob = (startsAt: string, endsAt: string) => ({
  kind: "class" as const,
  input: { title: "Rennen", instructor: "Demo", cohort: "Demo", term: "WS 2026/27", roomId: ROOM, startsAt: `2026-11-03T${startsAt}:00.000Z`, endsAt: `2026-11-03T${endsAt}:00.000Z` },
});

function race(jobs: unknown[]): Promise<string[]> {
  const barrier = new SharedArrayBuffer(4);
  return Promise.all(
    jobs.map(
      (job) =>
        new Promise<string>((resolve, reject) => {
          const worker = new Worker(new URL("./booking-race-worker.ts", import.meta.url), {
            workerData: { path, barrier, parties: jobs.length, job, now: NOW },
          });
          worker.once("message", resolve);
          worker.once("error", reject);
        }),
    ),
  );
}

type Row = { room_id: string; starts_at: string; ends_at: string };
function activeOccupancy(): Row[] {
  const db = openDatabase(path);
  const rows = db
    .prepare<[], Row>(
      `SELECT room_id, starts_at, ends_at FROM room_bookings WHERE status = 'confirmed'
       UNION ALL SELECT room_id, starts_at, ends_at FROM class_sessions WHERE status = 'scheduled'`,
    )
    .all();
  db.close();
  return rows;
}
function overlappingPairs(rows: Row[]) {
  let pairs = 0;
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++)
      if (rows[i].room_id === rows[j].room_id && rows[i].starts_at < rows[j].ends_at && rows[i].ends_at > rows[j].starts_at) pairs++;
  return pairs;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "booking-race-"));
  path = join(dir, "race.sqlite");
  const db = openDatabase(path);
  seedTeamDemo(db, new Date(NOW));
  db.prepare("DELETE FROM class_sessions").run();
  db.close();
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("concurrent writers on separate SQLite connections", () => {
  it("lets exactly one of several simultaneous overlapping bookings win, every round", { timeout: 60_000 }, async () => {
    const outcomes: string[][] = [];
    for (let round = 0; round < ROUNDS; round++) {
      const hour = String(8 + round).padStart(2, "0");
      // Three competitors for overlapping slots in the same room.
      outcomes.push(await race([bookingJob(`${hour}:00`, `${hour}:45`), bookingJob(`${hour}:15`, `${hour}:45`), bookingJob(`${hour}:30`, `${hour}:45`)]));
    }
    for (const round of outcomes) {
      expect(round.filter((o) => o === "accepted")).toHaveLength(1);
      // Losers see the committed winner (or a retryable lock timeout), never an error.
      for (const o of round.filter((x) => x !== "accepted")) expect(["time_conflict", "busy"]).toContain(o);
    }
    expect(activeOccupancy()).toHaveLength(ROUNDS);
    expect(overlappingPairs(activeOccupancy())).toBe(0);
  });

  it("never commits a class and a booking for the same time, whichever starts first", { timeout: 60_000 }, async () => {
    const seen = new Set<string>();
    for (let round = 0; round < ROUNDS; round++) {
      const h = 8 + round;
      const berlin = `${String(h).padStart(2, "0")}`;
      const utc = `${String(h - 1).padStart(2, "0")}`;
      const result = await race([bookingJob(`${berlin}:00`, `${berlin}:30`), classJob(`${utc}:15`, `${utc}:45`)]);
      expect(result.filter((o) => o === "accepted")).toHaveLength(1);
      for (const o of result.filter((x) => x !== "accepted")) expect(["time_conflict", "booking_conflict", "conflict", "busy"]).toContain(o);
      seen.add(result.join("|"));
    }
    expect(overlappingPairs(activeOccupancy())).toBe(0);
    // Record which side won in which round (useful evidence; order is not forced).
    console.log(`class-vs-booking race outcomes [booking|class]: ${[...seen].join(", ")}`);
  });

  it("accepts non-overlapping simultaneous bookings", { timeout: 60_000 }, async () => {
    const result = await race([bookingJob("08:00", "09:00"), bookingJob("09:00", "10:00"), bookingJob("10:00", "11:00")]);
    expect(result).toEqual(["accepted", "accepted", "accepted"]);
    expect(overlappingPairs(activeOccupancy())).toBe(0);
  });
});
