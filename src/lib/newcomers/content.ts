/** Static DE/EN newcomer copy for the student HCI prototype.
 * Do not add official opening hours, contacts, room numbers, or claims without verification.
 */
export type LangCopy = { de: string; en: string };
export type NewcomerCard = {
  id: "rooms" | "schedule" | "notices" | "help";
  title: LangCopy;
  body: LangCopy;
  actionLabel: LangCopy;
};

export const NEWCOMER_CARDS: readonly NewcomerCard[] = [
  {
    id: "rooms",
    title: { de: "Räume finden", en: "Find a room" },
    body: {
      de: "Öffne die Raumübersicht, um nach einem eingetragenen Raum zu suchen. Demo-Räume sind keine bestätigten Angaben zum echten Campus.",
      en: "Open the room directory to look for a listed room. Demo rooms are not verified information about the real campus.",
    },
    actionLabel: { de: "Raumübersicht öffnen", en: "Open room directory" },
  },
  {
    id: "schedule",
    title: { de: "Stundenplan ansehen", en: "View the schedule" },
    body: {
      de: "Sieh dir eingetragene Lehrveranstaltungen nach Datum und Raum an. Prüfe wichtige Termine zusätzlich über offizielle Hochschulquellen.",
      en: "Browse listed classes by date and room. Confirm important class information through official university sources as well.",
    },
    actionLabel: { de: "Stundenplan öffnen", en: "Open schedule" },
  },
  {
    id: "notices",
    title: { de: "Aktuelle Hinweise", en: "Current notices" },
    body: {
      de: "Hier werden in der integrierten Version veröffentlichte Hinweise gezeigt. Demo-Einträge müssen klar als Beispiele erkennbar sein.",
      en: "The integrated version will show published notices. Demo entries must be clearly marked as examples.",
    },
    actionLabel: { de: "Hinweise ansehen", en: "View notices" },
  },
  {
    id: "help",
    title: { de: "Du brauchst Hilfe?", en: "Need help?" },
    body: {
      de: "Nutze die offiziellen Kontakt- und Informationskanäle der Hochschule. In diesem Prototyp stehen keine unbestätigten Kontakte oder Öffnungszeiten.",
      en: "Use the university’s official contact and information channels. This prototype does not list unverified contacts or opening hours.",
    },
    actionLabel: { de: "Hinweis lesen", en: "Read guidance" },
  },
] as const;
