import { addDays, berlinDateOf, berlinLocalToUtcIso, isCalendarDate } from "../time/berlin.ts";

/** DEMO rules, *proposed* B1 for team approval (not a university policy). */
export const BOOKING_POLICY = {
  timeZone: "Europe/Berlin",
  daysAhead: 13,
  opens: "08:00",
  closes: "20:00",
  minuteStep: 15,
  minMinutes: 15,
  maxMinutes: 120,
} as const;

/** Approved for this HCI DEMONSTRATION ONLY, as requested by Parsa (30 Oct 2026).
 * This is NOT a statement about actual university booking permission.
 * One shared allowlist drives both client UI and server-side booking checks.
 */
export const DEMO_BOOKABLE_ROOM_CODES = [
  "K1-103",
  "K1-114",
  "K1-119",
  "K1-112",
  "K1-121",
  "K1-120",
  "K1-125",
  "K1-218",
  "K1-217",
  "K1-216",
  "K1-207",
  "K1-210",
  "K1-206",
  "K1-204",
  "K1-211",
  "K1-301",
  "K1-302",
  "K1-303",
  "K1-307",
  "K1-305",
  "K1-306",
] as const;
const demoBookable = new Set<string>(DEMO_BOOKABLE_ROOM_CODES);
export function isDemoBookableRoom(code: string): boolean {
  return demoBookable.has(code.toUpperCase());
}

export type BookingInput = {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  requestId: string;
  cancelToken: string;
};
export type BookingPeriod = { startsAt: string; endsAt: string };

type Validation =
  | { ok: true; period: BookingPeriod }
  | { ok: false; message: string };

export function hhmmToMinutes(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
export function minutesToHhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function isBookingDateInRange(date: string, now: Date): boolean {
  if (!isCalendarDate(date)) return false;
  const today = berlinDateOf(now);
  return date >= today && date <= addDays(today, BOOKING_POLICY.daysAhead);
}

/** Validate with SERVER time, never trust the browser's locale/clock. */
export function validatePeriod(date: string, startTime: string, endTime: string, now: Date): Validation {
  if (!isBookingDateInRange(date, now)) return { ok: false, message: "Datum außerhalb des Demo-Buchungszeitraums." };
  const start = hhmmToMinutes(startTime);
  const end = hhmmToMinutes(endTime);
  const opens = hhmmToMinutes(BOOKING_POLICY.opens)!;
  const closes = hhmmToMinutes(BOOKING_POLICY.closes)!;
  if (start === null || end === null || start < opens || end > closes || start >= end) {
    return { ok: false, message: "Ungültige Start- oder Endzeit." };
  }
  const duration = end - start;
  if (start % BOOKING_POLICY.minuteStep || end % BOOKING_POLICY.minuteStep || duration < BOOKING_POLICY.minMinutes || duration > BOOKING_POLICY.maxMinutes) {
    return { ok: false, message: "Buchungen sind in 15-Minuten-Schritten für 15–120 Minuten erlaubt." };
  }
  const startsAt = berlinLocalToUtcIso(`${date}T${startTime}`);
  const endsAt = berlinLocalToUtcIso(`${date}T${endTime}`);
  if (!startsAt || !endsAt || Date.parse(startsAt) < now.getTime() || endsAt <= startsAt) {
    return { ok: false, message: "Der gewählte Zeitraum liegt in der Vergangenheit oder ist ungültig." };
  }
  return { ok: true, period: { startsAt, endsAt } };
}

/** Accept ONLY canonical unpadded base64url of the expected random-byte length. */
export function validRandomToken(value: unknown, size: number): value is string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  const bytes = Buffer.from(value, "base64url");
  return bytes.length === size && bytes.toString("base64url") === value;
}

export function parseBookingInput(raw: unknown): { ok: true; content: BookingInput } | { ok: false; message: string } {
  if (typeof raw !== "object" || !raw || Array.isArray(raw)) return { ok: false, message: "Ungültige Daten." };
  const v = raw as Record<string, unknown>;
  if (typeof v.roomId !== "string" || v.roomId.length < 1 || v.roomId.length > 100 ||
      typeof v.date !== "string" || typeof v.startTime !== "string" || typeof v.endTime !== "string" ||
      !validRandomToken(v.requestId, 16) || !validRandomToken(v.cancelToken, 32)) {
    return { ok: false, message: "Bitte die Buchungsdaten prüfen." };
  }
  return { ok: true, content: { roomId: v.roomId, date: v.date, startTime: v.startTime, endTime: v.endTime, requestId: v.requestId, cancelToken: v.cancelToken } };
}

/** Intervals are half-open: [10:00, 11:00) doesn't conflict with [11:00, 12:00). */
export function overlaps(a: BookingPeriod, b: BookingPeriod): boolean {
  return a.startsAt < b.endsAt && a.endsAt > b.startsAt;
}
