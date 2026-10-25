import { z } from "zod";
import type { FloorId } from "../rooms/schema.ts";
import { berlinLocalToUtcIso, isCalendarDate } from "../time/berlin.ts";
import { toFieldErrors, type FieldErrorMap } from "../validation.ts";

// Shared class-session contract. Safe to import from client and server code.

export const SESSION_TITLE_MAX = 120;
export const INSTRUCTOR_MAX = 80;
export const COHORT_MAX = 60;

export type SessionStatus = "scheduled" | "cancelled";

/** Stored session data. Times are UTC ISO strings. */
export type SessionContent = {
  title: string;
  instructor: string;
  cohort: string;
  term: string;
  roomId: string;
  startsAt: string;
  endsAt: string;
};

/** Public projection: the only session fields anonymous visitors receive. */
export type PublicSession = {
  id: string;
  title: string;
  instructor: string;
  cohort: string;
  term: string;
  startsAt: string;
  endsAt: string;
  status: SessionStatus;
  room: { id: string; code: string; name: string; floorId: FloorId };
  isDemo: boolean;
};

// Terms: "WS 2026/27" (winter) or "SS 2027" (summer). The month ranges below
// (WS October–March, SS April–September) are an assumption used only to
// suggest a term in the form; the server checks the format, not the dates.
const TERM_PATTERN = /^(?:WS (\d{4})\/(\d{2})|SS (\d{4}))$/;

export function isValidTerm(term: string): boolean {
  const match = TERM_PATTERN.exec(term);
  if (!match) return false;
  if (match[3]) return true;
  return (Number(match[1]) + 1) % 100 === Number(match[2]);
}

const winterTerm = (startYear: number) => `WS ${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;

/** Suggested term for a calendar date "YYYY-MM-DD". */
export function termForDate(date: string): string {
  const [year, month] = date.split("-").map(Number);
  if (month >= 10) return winterTerm(year);
  if (month <= 3) return winterTerm(year - 1);
  return `SS ${year}`;
}

/** Previous, current and next term around a date, for the admin form. */
export function termOptions(date: string): string[] {
  const current = termForDate(date);
  const summer = /^SS (\d{4})$/.exec(current);
  if (summer) {
    const year = Number(summer[1]);
    return [winterTerm(year - 1), current, winterTerm(year)];
  }
  const start = Number(current.slice(3, 7));
  return [`SS ${start}`, current, `SS ${start + 1}`];
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const text = (max: number, missing: string, tooLong: string) =>
  z.string({ error: missing }).trim().min(1, missing).max(max, tooLong);

const inputSchema = z.object({
  title: text(SESSION_TITLE_MAX, "Bitte den Titel der Lehrveranstaltung eingeben.", `Der Titel darf höchstens ${SESSION_TITLE_MAX} Zeichen lang sein.`),
  instructor: text(INSTRUCTOR_MAX, "Bitte die Lehrperson eingeben.", `Die Lehrperson darf höchstens ${INSTRUCTOR_MAX} Zeichen lang sein.`),
  cohort: text(COHORT_MAX, "Bitte Studiengang/Semester eingeben.", `Studiengang/Semester darf höchstens ${COHORT_MAX} Zeichen lang sein.`),
  term: z
    .string({ error: "Bitte ein Semester wählen." })
    .trim()
    .refine(isValidTerm, "Bitte ein Semester im Format „WS 2026/27“ oder „SS 2027“ wählen."),
  roomId: z.string({ error: "Bitte einen Raum wählen." }).trim().min(1, "Bitte einen Raum wählen.").max(100),
  date: z.string({ error: "Bitte ein Datum angeben." }).refine(isCalendarDate, "Bitte ein gültiges Datum angeben."),
  startTime: z.string({ error: "Bitte eine Beginnzeit angeben." }).regex(TIME_PATTERN, "Bitte eine gültige Beginnzeit angeben."),
  endTime: z.string({ error: "Bitte eine Endzeit angeben." }).regex(TIME_PATTERN, "Bitte eine gültige Endzeit angeben."),
});

/**
 * Admin form input: date "YYYY-MM-DD" and times "HH:mm" as Europe/Berlin wall
 * clock. A session starts and ends on the same day.
 */
export type SessionInput = z.input<typeof inputSchema>;
export type SessionField = keyof z.output<typeof inputSchema>;
export type SessionFieldErrors = FieldErrorMap<SessionField>;

export type SessionParseResult = { ok: true; content: SessionContent } | { ok: false; fieldErrors: SessionFieldErrors };

export function parseSessionInput(raw: unknown): SessionParseResult {
  const result = inputSchema.safeParse(raw);
  if (!result.success) return { ok: false, fieldErrors: toFieldErrors(result.error.issues) };
  const v = result.data;

  const startsAt = berlinLocalToUtcIso(`${v.date}T${v.startTime}`);
  const endsAt = berlinLocalToUtcIso(`${v.date}T${v.endTime}`);
  const gap = "Diese Uhrzeit gibt es an diesem Tag nicht (Zeitumstellung).";
  const fieldErrors: SessionFieldErrors = {};
  if (!startsAt) fieldErrors.startTime = [gap];
  if (!endsAt) fieldErrors.endTime = [gap];
  else if (startsAt && endsAt <= startsAt) fieldErrors.endTime = ["Das Ende muss nach dem Beginn liegen."];
  if (!startsAt || !endsAt || fieldErrors.endTime) return { ok: false, fieldErrors };

  return {
    ok: true,
    content: { title: v.title, instructor: v.instructor, cohort: v.cohort, term: v.term, roomId: v.roomId, startsAt, endsAt },
  };
}
