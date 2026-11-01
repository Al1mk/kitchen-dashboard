// Worker for tests/unit/booking-concurrency.test.ts: opens its OWN SQLite
// connection to the shared file, waits at a barrier, then performs one write.
import { parentPort, workerData } from "node:worker_threads";
import { createBookingRepository } from "../../src/lib/bookings/repository.ts";
import { openDatabase } from "../../src/lib/db/database.ts";
import { isBusyError } from "../../src/lib/db/busy.ts";
import { createSessionRepository } from "../../src/lib/sessions/repository.ts";

type Job =
  | { kind: "booking"; input: { roomId: string; date: string; startTime: string; endTime: string; requestId: string; cancelToken: string } }
  | { kind: "class"; input: { title: string; instructor: string; cohort: string; term: string; roomId: string; startsAt: string; endsAt: string } };

const { path, barrier, parties, job, now } = workerData as { path: string; barrier: SharedArrayBuffer; parties: number; job: Job; now: string };
const clock = () => new Date(now);
const db = openDatabase(path);
const bookings = createBookingRepository(db, clock);
const sessions = createSessionRepository(db, clock);

// Barrier: everybody increments, the last one wakes the others.
const counter = new Int32Array(barrier);
if (Atomics.add(counter, 0, 1) + 1 === parties) Atomics.notify(counter, 0);
else while (Atomics.load(counter, 0) < parties) Atomics.wait(counter, 0, Atomics.load(counter, 0), 1000);

let outcome: string;
try {
  const result = job.kind === "booking" ? bookings.create(job.input) : sessions.create(job.input);
  outcome = result.ok ? "accepted" : result.reason;
} catch (error) {
  outcome = isBusyError(error) ? "busy" : `error:${String(error)}`;
}
db.close();
parentPort!.postMessage(outcome);
