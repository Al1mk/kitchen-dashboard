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

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const longDateFormatter = new Intl.DateTimeFormat("de-DE", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

/** e.g. "24.10.2026, 14:05" */
export function formatBerlinDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

/** e.g. "14:05" */
export function formatBerlinTime(date: Date): string {
  return timeFormatter.format(date);
}

/** e.g. "Samstag, 24. Oktober" */
export function formatBerlinLongDate(date: Date): string {
  return longDateFormatter.format(date);
}
