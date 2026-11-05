import { CATEGORY_LABELS, type Category } from "../announcements/schema.ts";
import { FLOOR_LABELS, ROOM_TYPE_LABELS, type FloorId, type RoomType } from "../rooms/schema.ts";

// Interface text of the public pages in German and English (ADR-017). Safe to
// import from client and server code. The admin stays German. Staff content is
// never translated automatically: announcements and rooms may carry an English
// version entered in the admin (ADR-019); without it the German text is shown
// and the item is marked. Course titles, people and room codes stay as entered.

export const LANGS = ["de", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** `?lang=en` selects English; anything else (or nothing) is German. */
export function parseLang(value: unknown): Lang {
  return value === "en" ? "en" : "de";
}

/**
 * Public link that keeps the visitor's language. Empty params are dropped;
 * German is the default and adds no parameter.
 */
export function publicHref(path: string, lang: Lang, params: Record<string, string | null | undefined> = {}): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (lang !== "de") query.set("lang", lang);
  return query.size ? `${path}?${query}` : path;
}

export type PublicSection = "start" | "display" | "rooms" | "schedule" | "booking" | "map" | "newcomers";

/** One staff-entered text as shown to the visitor. */
export type LocalizedText = { text: string; lang: Lang; fallback: boolean };

/**
 * The English version when the visitor chose English and one exists;
 * otherwise the German original, flagged as a fallback in the English interface.
 */
export function localize(de: string, en: string | null, lang: Lang): LocalizedText {
  if (lang === "en" && en) return { text: en, lang: "en", fallback: false };
  return { text: de, lang: "de", fallback: lang === "en" && de !== "" };
}

/** How much of an item is shown in German instead of English: null (nothing), "partial" or "all". */
export function fallbackLevel(texts: LocalizedText[]): "partial" | "all" | null {
  const shown = texts.filter((t) => t.text !== "");
  const fallbacks = shown.filter((t) => t.fallback).length;
  if (fallbacks === 0) return null;
  return fallbacks === shown.length ? "all" : "partial";
}

const de = {
  sections: { start: "Start", display: "Mitteilungen", rooms: "Räume", schedule: "Stundenplan", booking: "Raumbuchung", map: "Karte", newcomers: "Neu am Campus" } as Record<PublicSection, string>,
  navLabel: "Campus-Informationen",
  languageLabel: "Sprache",
  skipLink: "Zum Inhalt springen",
  footer: "Prototyp im Kurs Mensch-Maschine-Interaktion – keine offizielle Anzeige der Hochschule Coburg.",
  contentNote: null as string | null,
  fallback: { all: "Nur auf Deutsch", partial: "Teilweise auf Deutsch" },
  start: {
    title: "Campus-Informationen",
    intro: "Informationen für Studierende und Gäste am Lucas-Cranach-Campus.",
    tiles: {
      newcomers: "Erste Orientierung: wo finde ich was?",
      map: "Räume auf dem Stockwerksplan finden",
      display: "Aktuelle Hinweise für den Campus",
      rooms: "Alle Räume nach Stockwerk",
      schedule: "Lehrveranstaltungen nach Tag und Raum",
      booking: "Freie Zeiten prüfen und einen Raum probeweise reservieren (Demo)",
    },
  },
  load: {
    loading: { rooms: "Räume werden geladen …", sessions: "Termine werden geladen …", announcements: "Mitteilungen werden geladen …" },
    failed: {
      rooms: "Räume können gerade nicht geladen werden.",
      sessions: "Termine können gerade nicht geladen werden.",
      announcements: "Mitteilungen können gerade nicht geladen werden.",
    },
    retrying: "Wir versuchen es automatisch weiter.",
    retry: "Erneut versuchen",
    stale: (time: string) => `Verbindung unterbrochen – angezeigt wird der Stand von ${time} Uhr.`,
  },
  demoNotice: {
    lead: "Beispieldaten:",
    text: "Einträge mit der Markierung „Beispiel“ sind erfundene Demo-Daten, keine offiziellen Raum- oder Termininformationen.",
  },
  demoTag: "Beispiel",
  floors: FLOOR_LABELS as Record<FloorId, string>,
  roomTypes: ROOM_TYPE_LABELS as Record<RoomType, string>,
  roomFallback: "Raum",
  rooms: {
    empty: "Zurzeit sind keine Räume eingetragen.",
    emptyHint: "Neue Räume erscheinen hier automatisch.",
    todayInRoom: "Heute in diesem Raum",
    onMap: "Auf der Karte zeigen",
    book: "Raum reservieren (Demo)",
  },
  schedule: {
    chooseDay: "Tag wählen",
    previousDay: "← Vortag",
    today: "Heute",
    nextDay: "Folgetag →",
    room: "Raum",
    allRooms: "Alle Räume",
    onMap: "Auf der Karte",
    bookRoom: "Diesen Raum reservieren (Demo)",
    roomUnavailable: "Dieser Raum ist nicht verfügbar oder wurde archiviert. Wähle einen anderen Raum oder zeige alle Räume an.",
    empty: "An diesem Tag sind keine Termine eingetragen.",
    emptyHint: "Änderungen erscheinen hier automatisch.",
    cancelled: "Entfällt",
    running: "Läuft gerade",
  },
  board: {
    clock: "Uhrzeit",
    empty: "Zurzeit gibt es keine Mitteilungen.",
    emptyHint: "Neue Mitteilungen erscheinen hier automatisch.",
    pinned: "Hervorgehoben",
    validUntil: (dateTime: string) => `Gültig bis ${dateTime} Uhr`,
    categories: CATEGORY_LABELS as Record<Category, string>,
  },
};

export type PublicText = typeof de;

const en: PublicText = {
  sections: { start: "Home", display: "Announcements", rooms: "Rooms", schedule: "Schedule", booking: "Booking", map: "Map", newcomers: "New to campus" },
  navLabel: "Campus information",
  languageLabel: "Language",
  skipLink: "Skip to main content",
  footer: "Prototype from the Human-Computer Interaction course – not an official display of Hochschule Coburg.",
  contentNote:
    "Course titles, lecturers and study groups are shown as entered by campus staff, in German. Announcements and rooms without a full English version are marked “Only in German” or “Partly in German”.",
  fallback: { all: "Only in German", partial: "Partly in German" },
  start: {
    title: "Campus information",
    intro: "Information for students and visitors at Lucas-Cranach-Campus.",
    tiles: {
      newcomers: "First orientation: where do I find what?",
      map: "Find rooms on the floor plan",
      display: "Current notices for the campus",
      rooms: "All rooms by floor",
      schedule: "Classes by day and room",
      booking: "Check free times and make a test booking (demo)",
    },
  },
  load: {
    loading: { rooms: "Loading rooms …", sessions: "Loading classes …", announcements: "Loading announcements …" },
    failed: {
      rooms: "Rooms cannot be loaded right now.",
      sessions: "Classes cannot be loaded right now.",
      announcements: "Announcements cannot be loaded right now.",
    },
    retrying: "We keep trying automatically.",
    retry: "Try again",
    stale: (time: string) => `Connection lost – showing the information from ${time}.`,
  },
  demoNotice: {
    lead: "Sample data:",
    text: "Entries marked “Example” are invented demo data, not official room or class information.",
  },
  demoTag: "Example",
  floors: { EG: "Ground floor", "1OG": "1st floor", "2OG": "2nd floor", "3OG": "3rd floor" },
  roomTypes: {
    lecture: "Lecture hall",
    seminar: "Seminar room",
    lab: "Lab / computer room",
    study: "Study / group room",
    common: "Common room / kitchen",
    office: "Office",
    other: "Other",
  },
  roomFallback: "Room",
  rooms: {
    empty: "No rooms have been added yet.",
    emptyHint: "New rooms appear here automatically.",
    todayInRoom: "Today in this room",
    onMap: "Show on the map",
    book: "Book this room (demo)",
  },
  schedule: {
    chooseDay: "Choose a day",
    previousDay: "← Previous day",
    today: "Today",
    nextDay: "Next day →",
    room: "Room",
    allRooms: "All rooms",
    onMap: "On the map",
    bookRoom: "Book this room (demo)",
    roomUnavailable: "This room is unavailable or has been archived. Choose another room or view all rooms.",
    empty: "No classes are scheduled on this day.",
    emptyHint: "Changes appear here automatically.",
    cancelled: "Cancelled",
    running: "In progress",
  },
  board: {
    clock: "Time",
    empty: "There are no announcements at the moment.",
    emptyHint: "New announcements appear here automatically.",
    pinned: "Highlighted",
    validUntil: (dateTime: string) => `Valid until ${dateTime}`,
    categories: { general: "General", event: "Event", important: "Important" },
  },
};

export const PUBLIC_TEXT: Record<Lang, PublicText> = { de, en };
