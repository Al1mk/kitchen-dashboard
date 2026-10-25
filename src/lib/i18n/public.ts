import { CATEGORY_LABELS, type Category } from "../announcements/schema.ts";
import { FLOOR_LABELS, ROOM_TYPE_LABELS, type FloorId, type RoomType } from "../rooms/schema.ts";

// Interface text of the public pages in German and English (ADR-017). Safe to
// import from client and server code. The admin stays German. Content typed by
// staff (announcements, room names, course titles …) is not translated; it is
// shown as entered and marked as German (lang="de").

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

export type PublicSection = "start" | "display" | "rooms" | "schedule";

const de = {
  sections: { start: "Start", display: "Mitteilungen", rooms: "Räume", schedule: "Stundenplan" } as Record<PublicSection, string>,
  navLabel: "Campus-Informationen",
  languageLabel: "Sprache",
  footer: "Prototyp im Kurs Mensch-Maschine-Interaktion – keine offizielle Anzeige der Hochschule Coburg.",
  contentNote: null as string | null,
  start: {
    title: "Campus-Informationen",
    intro: "Informationen für Studierende und Gäste am Lucas-Cranach-Campus.",
    tiles: {
      display: "Aktuelle Hinweise für den Campus",
      rooms: "Alle Räume nach Stockwerk",
      schedule: "Lehrveranstaltungen nach Tag und Raum",
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
  },
  schedule: {
    chooseDay: "Tag wählen",
    previousDay: "← Vortag",
    today: "Heute",
    nextDay: "Folgetag →",
    room: "Raum",
    allRooms: "Alle Räume",
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
  sections: { start: "Home", display: "Announcements", rooms: "Rooms", schedule: "Schedule" },
  navLabel: "Campus information",
  languageLabel: "Language",
  footer: "Prototype from the Human-Computer Interaction course – not an official display of Hochschule Coburg.",
  contentNote:
    "Announcements, room names and course details are entered by campus staff and are shown in German. English versions are not available yet.",
  start: {
    title: "Campus information",
    intro: "Information for students and visitors at Lucas-Cranach-Campus.",
    tiles: {
      display: "Current notices for the campus",
      rooms: "All rooms by floor",
      schedule: "Classes by day and room",
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
  floors: { EG: "Ground floor", "1OG": "1st floor", "2OG": "2nd floor" },
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
  },
  schedule: {
    chooseDay: "Choose a day",
    previousDay: "← Previous day",
    today: "Today",
    nextDay: "Next day →",
    room: "Room",
    allRooms: "All rooms",
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
