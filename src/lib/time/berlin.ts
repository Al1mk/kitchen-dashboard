// All timestamps are stored as UTC ISO strings. The admin form works with
// Europe/Berlin wall-clock values ("YYYY-MM-DDTHH:mm", as used by
// <input type="datetime-local">), so conversion happens only at the edges.

export const TIME_ZONE = "Europe/Berlin";

const LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function berlinParts(date: Date) {
  const parts: Record<string, string> = {};
  for (const p of partsFormatter.formatToParts(date)) parts[p.type] = p.value;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset of Berlin wall-clock time from UTC at the given instant, in ms. */
function berlinOffsetMs(date: Date): number {
  const p = berlinParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a Berlin wall-clock value to a UTC ISO string.
 * Returns null for malformed values and for local times that do not exist
 * (spring DST gap). For the ambiguous autumn hour the first occurrence wins.
 */
export function berlinLocalToUtcIso(local: string): string | null {
  const match = LOCAL_PATTERN.exec(local);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  if (Number.isNaN(naive)) return null;

  const candidates = [naive - berlinOffsetMs(new Date(naive - 3 * 3600_000)), naive - berlinOffsetMs(new Date(naive + 3 * 3600_000))];
  for (const utc of candidates.sort((a, b) => a - b)) {
    if (utcIsoToBerlinLocal(new Date(utc).toISOString()) === local) {
      return new Date(utc).toISOString();
    }
  }
  return null;
}

/** Converts a UTC ISO string to a Berlin wall-clock value for form inputs. */
export function utcIsoToBerlinLocal(iso: string): string {
  const p = berlinParts(new Date(iso));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True for an existing calendar date "YYYY-MM-DD" (rejects e.g. 2026-02-30). */
export function isCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Calendar arithmetic on "YYYY-MM-DD" values (no time zone involved). */
export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** The Berlin calendar date ("YYYY-MM-DD") of an instant. */
export function berlinDateOf(date: Date): string {
  return utcIsoToBerlinLocal(date.toISOString()).slice(0, 10);
}

/**
 * UTC bounds [start, end) of a Berlin calendar day. Midnight always exists in
 * Berlin (DST switches at 02:00/03:00), so days are 23, 24 or 25 hours long.
 */
export function berlinDayRange(date: string): { start: string; end: string } {
  return { start: berlinLocalToUtcIso(`${date}T00:00`)!, end: berlinLocalToUtcIso(`${addDays(date, 1)}T00:00`)! };
}

// Public pages also format in English (en-GB: day before month, 24-hour clock).
type FormatLang = "de" | "en";
const byLang = (options: Intl.DateTimeFormatOptions): Record<FormatLang, Intl.DateTimeFormat> => ({
  de: new Intl.DateTimeFormat("de-DE", options),
  en: new Intl.DateTimeFormat("en-GB", options),
});

const dateTimeFormatter = byLang({
  timeZone: TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const longDateFormatter = byLang({
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** e.g. "24.10.2026, 14:05" (en: "24 Oct 2026, 14:05") */
export function formatBerlinDateTime(iso: string, lang: FormatLang = "de"): string {
  return dateTimeFormatter[lang].format(new Date(iso));
}

/** e.g. "14:05" */
export function formatBerlinTime(date: Date): string {
  return timeFormatter.format(date);
}

/** e.g. "Samstag, 24. Oktober" (en: "Saturday 24 October") */
export function formatBerlinLongDate(date: Date, lang: FormatLang = "de"): string {
  return longDateFormatter[lang].format(date);
}

const calendarDateFormatter = byLang({
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const shortCalendarDateFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: "UTC",
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

/** "2026-11-02" → "Montag, 2. November 2026" (a calendar date, not an instant; en: "Monday, 2 November 2026"). */
export function formatCalendarDate(date: string, lang: FormatLang = "de"): string {
  return calendarDateFormatter[lang].format(new Date(`${date}T12:00:00Z`));
}

/** "2026-11-02" → "Mo., 02.11." */
export function formatShortCalendarDate(date: string): string {
  return shortCalendarDateFormatter.format(new Date(`${date}T12:00:00Z`));
}
