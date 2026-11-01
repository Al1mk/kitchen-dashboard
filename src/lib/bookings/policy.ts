import { addDays, berlinDateOf, berlinLocalToUtcIso, isCalendarDate } from "../time/berlin.ts";

// Booking rules: the single definition used by the API, the booking page and
// the client (docs/contracts.md C4). These are DEMO assumptions from the joint
// Aryan/Parsa package, not a university policy. Safe for client and server.

export const BOOKING_POLICY = {
  timeZone: "Europe/Berlin",
  /** Today plus 13 further days = 14 bookable dates. */
  daysAhead: 13,
  opens: "08:00",
  closes: "20:00",
  minuteStep: 15,
  minMinutes: 15,
  maxMinutes: 120,
} as const;

// Who may be booked is decided at runtime only by the room's admin-controlled
// `reservable` flag (and the room being active). The 21 room codes chosen in
// the joint package are seed provenance (src/lib/map/team-catalog.ts), not a
// permission list: an editable room code is never a permission key.

export type BookingInput = {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  requestId: string;
  cancelToken: string;
};
export type BookingPeriod = { startsAt: string; endsAt: string };

/** Machine-readable reason for a rejected period; the public UI translates it. */
export type ValidationDetail = "date_out_of_range" | "invalid_time" | "grid" | "in_past" | "invalid_input";

type Validation = { ok: true; period: BookingPeriod } | { ok: false; detail: ValidationDetail; message: string };

export function hhmmToMinutes(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
export function minutesToHhmm(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** First and last bookable Berlin date for the given server time. */
export function bookingDateRange(now: Date): { first: string; last: string } {
  const first = berlinDateOf(now);
  return { first, last: addDays(first, BOOKING_POLICY.daysAhead) };
}

export function isBookingDateInRange(date: string, now: Date): boolean {
  if (!isCalendarDate(date)) return false;
  const { first, last } = bookingDateRange(now);
  return date >= first && date <= last;
}

/** Validate with SERVER time, never trust the browser's locale/clock. */
export function validatePeriod(date: string, startTime: string, endTime: string, now: Date): Validation {
  if (!isBookingDateInRange(date, now)) return { ok: false, detail: "date_out_of_range", message: "Datum außerhalb des Demo-Buchungszeitraums." };
  const start = hhmmToMinutes(startTime);
  const end = hhmmToMinutes(endTime);
  const opens = hhmmToMinutes(BOOKING_POLICY.opens)!;
  const closes = hhmmToMinutes(BOOKING_POLICY.closes)!;
  if (start === null || end === null || start < opens || end > closes || start >= end) {
    return { ok: false, detail: "invalid_time", message: "Ungültige Start- oder Endzeit." };
  }
  const duration = end - start;
  if (start % BOOKING_POLICY.minuteStep || end % BOOKING_POLICY.minuteStep || duration < BOOKING_POLICY.minMinutes || duration > BOOKING_POLICY.maxMinutes) {
    return { ok: false, detail: "grid", message: "Buchungen sind in 15-Minuten-Schritten für 15–120 Minuten erlaubt." };
  }
  const startsAt = berlinLocalToUtcIso(`${date}T${startTime}`);
  const endsAt = berlinLocalToUtcIso(`${date}T${endTime}`);
  if (!startsAt || !endsAt || endsAt <= startsAt) {
    return { ok: false, detail: "invalid_time", message: "Ungültige Start- oder Endzeit." };
  }
  if (Date.parse(startsAt) < now.getTime()) {
    return { ok: false, detail: "in_past", message: "Der gewählte Zeitraum liegt in der Vergangenheit." };
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
