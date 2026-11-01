/** Static DE/EN newcomer copy for the student HCI prototype.
 * Do not add official opening hours, contacts, room numbers, or claims without verification.
 *
 * Original structure and wording by Reza (commit 6bc0b21). Adapted by Ali in
 * the integration (T15): task-oriented titles, the map as the room-finding
 * destination, a booking card, and an honest help card that points to an
 * existing in-app destination instead of an unverified contact. Sources and
 * open factual questions: docs/hci/research/newcomer-content-sources.md.
 */
export type LangCopy = { de: string; en: string };
export type NewcomerCard = {
  id: "rooms" | "schedule" | "notices" | "booking" | "help";
  path: string;
  title: LangCopy;
  body: LangCopy;
  actionLabel: LangCopy;
};

export const NEWCOMER_CARDS: readonly NewcomerCard[] = [
  {
    id: "rooms",
    path: "/map",
    title: { de: "Einen Raum finden", en: "Find a room" },
    body: {
      de: "Suche nach Raumnummer oder Name und sieh, auf welchem Stockwerk der Raum liegt. Die Pläne sind Illustrationen, keine geprüften Gebäudepläne.",
      en: "Search by room number or name and see which floor the room is on. The plans are illustrations, not verified building plans.",
    },
    actionLabel: { de: "Karte öffnen", en: "Open the map" },
  },
  {
    id: "schedule",
    path: "/schedule",
    title: { de: "Was findet heute statt?", en: "What is on today?" },
    body: {
      de: "Sieh dir die eingetragenen Lehrveranstaltungen nach Tag und Raum an. Abgesagte Termine sind markiert.",
      en: "See the listed classes by day and room. Cancelled classes are marked.",
    },
    actionLabel: { de: "Stundenplan öffnen", en: "Open the schedule" },
  },
  {
    id: "notices",
    path: "/display",
    title: { de: "Aktuelle Hinweise", en: "Current notices" },
    body: {
      de: "Hier stehen die Mitteilungen, die das Campus-Team veröffentlicht hat.",
      en: "Announcements published by the campus team appear here.",
    },
    actionLabel: { de: "Hinweise ansehen", en: "View notices" },
  },
  {
    id: "booking",
    path: "/booking",
    title: { de: "Einen Lernraum reservieren", en: "Reserve a study room" },
    body: {
      de: "Prüfe freie Zeiten und reserviere einen freigegebenen Raum für bis zu zwei Stunden – im Prototyp nur als Demo.",
      en: "Check free times and reserve an open room for up to two hours – a demo in this prototype.",
    },
    actionLabel: { de: "Raum reservieren", en: "Book a room" },
  },
  {
    id: "help",
    path: "/display",
    title: { de: "Du brauchst Hilfe?", en: "Need help?" },
    body: {
      de: "Geprüfte Kontaktangaben und Öffnungszeiten sind in diesem Prototyp noch nicht hinterlegt. Frag am besten Studierende oder Mitarbeitende vor Ort; wichtige Hinweise des Campus-Teams stehen bei den Mitteilungen.",
      en: "Verified contact details and opening hours are not yet included in this prototype. Ask students or staff on site; important notices from the campus team are in the announcements.",
    },
    actionLabel: { de: "Mitteilungen ansehen", en: "View announcements" },
  },
] as const;
