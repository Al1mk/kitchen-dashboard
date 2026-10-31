import type { Lang } from "@/lib/i18n/public.ts";

// Public booking texts in German and English (T13). Server `message` strings
// are never shown; API `error`/`detail` codes are translated here instead.

const de = {
  disclaimer: "DEMO – keine echte Hochschulreservierung. Keine Anmeldung, kein offizieller Anspruch auf den Raum.",
  room: "1. Raum auswählen",
  roomPlaceholder: "Bitte einen Raum wählen",
  roomsLoading: "Räume werden geladen …",
  roomsFailed: "Die Räume können gerade nicht geladen werden.",
  roomsEmpty: "Zurzeit ist kein Raum für Demo-Reservierungen freigegeben.",
  requestedUnavailable:
    "Der angefragte Raum kann gerade nicht reserviert werden (unbekannt, archiviert oder nicht freigegeben). Es wurde kein anderer Raum ausgewählt – bitte wähle selbst einen aus der Liste.",
  date: "2. Datum",
  duration: "3. Dauer",
  minutes: (n: number) => `${n} Minuten`,
  time: "4. Freie Startzeit wählen",
  chooseRoomFirst: "Wähle zuerst einen Raum.",
  busy: "Belegte Zeiten",
  none: "Keine freien Zeitfenster. Wähle einen anderen Tag, Raum oder eine kürzere Dauer.",
  loading: "Freie Zeiten werden geladen …",
  availabilityFailed: "Die freien Zeiten können gerade nicht geladen werden.",
  retry: "Erneut versuchen",
  confirm: "Weiter zur Bestätigung",
  review: "Reservierung prüfen",
  change: "Ändern",
  book: "Demo-Reservierung bestätigen",
  submitting: "Reservierung wird gespeichert …",
  lockedNote: "Bitte warten: Die Anfrage wird gesendet. Auswahl und Navigation sind so lange gesperrt.",
  uncertainTitle: "Wir konnten nicht bestätigen, ob die Reservierung gespeichert wurde.",
  uncertainText: "Sende sie erneut: Es wird genau dieselbe Anfrage wiederholt, eine doppelte Reservierung entsteht nicht.",
  resend: "Erneut senden",
  abandon: "Abbrechen",
  errors: {
    time_conflict: "Dieses Zeitfenster ist inzwischen belegt. Bitte wähle ein anderes.",
    room_not_reservable: "Dieser Raum kann gerade nicht reserviert werden. Bitte wähle einen anderen Raum.",
    date_out_of_range: "Dieses Datum liegt außerhalb des Demo-Zeitraums (heute und die nächsten 13 Tage).",
    invalid_time: "Diese Uhrzeit ist nicht buchbar (08:00–20:00 Uhr).",
    grid: "Reservierungen sind nur in 15-Minuten-Schritten und für 15 bis 120 Minuten möglich.",
    in_past: "Diese Startzeit liegt inzwischen in der Vergangenheit. Bitte wähle eine spätere.",
    generic: "Die Anfrage konnte nicht verarbeitet werden. Bitte versuche es erneut.",
  },
  guardTitle: "Reservierung läuft noch",
  guardText:
    "Die Reservierung wird gerade gespeichert oder ihr Ergebnis ist noch unklar. Wenn du jetzt gehst, kann sie trotzdem bestehen – aber Buchungsnummer und Stornierungscode gehen verloren, und du kannst sie nicht mehr selbst stornieren.",
  stay: "Hierbleiben",
  leave: "Trotzdem verlassen",
  mapLink: "Diesen Raum auf der Karte zeigen",
  scheduleLink: "Termine in diesem Raum",
  cancelLink: "Reservierung stornieren",
  receipt: {
    success: "Reservierung gespeichert",
    id: "Buchungsnummer",
    code: "Stornierungscode",
    noRecovery:
      "Wichtig: Notiere oder fotografiere Nummer und Code jetzt. Sie werden nirgends gespeichert und nicht verschickt. Ohne beide kannst du nicht selbst stornieren.",
    countdown: (s: number) => `Dieser Beleg wird in ${s} Sekunden ausgeblendet.`,
    more: "Mehr Zeit",
    finish: "Fertig",
  },
  cancel: {
    id: "Buchungsnummer",
    code: "Stornierungscode",
    go: "Stornierung bestätigen",
    pending: "Stornierung wird gesendet …",
    done: "Die Reservierung wurde storniert.",
    badId: "Die Buchungsnummer hat nicht das richtige Format. Bitte prüfe sie.",
    unauthorized: "Der Stornierungscode hat nicht das richtige Format. Bitte prüfe ihn.",
    not_found: "Nummer und Code passen zu keiner Reservierung. Bitte prüfe beide Angaben.",
    booking_ended: "Diese Reservierung ist bereits vorbei und kann nicht mehr storniert werden.",
    busy: "Das System ist gerade beschäftigt. Bitte versuche es gleich noch einmal.",
    generic: "Die Stornierung konnte nicht gesendet werden. Bitte versuche es erneut.",
    back: "Zur Raumbuchung",
    demo: "DEMO – kein offizielles Raumbuchungssystem.",
  },
};

export type BookingCopy = typeof de;

const en: BookingCopy = {
  disclaimer: "DEMO – not a real university room reservation. No login and no official entitlement to the room.",
  room: "1. Choose a room",
  roomPlaceholder: "Please choose a room",
  roomsLoading: "Loading rooms …",
  roomsFailed: "Rooms cannot be loaded right now.",
  roomsEmpty: "No room is currently open for demo bookings.",
  requestedUnavailable:
    "The requested room cannot be booked right now (unknown, archived or not open for booking). No other room was selected – please choose one from the list yourself.",
  date: "2. Date",
  duration: "3. Duration",
  minutes: (n: number) => `${n} minutes`,
  time: "4. Select a free start time",
  chooseRoomFirst: "Choose a room first.",
  busy: "Occupied times",
  none: "No free times. Try another day, room or a shorter duration.",
  loading: "Loading free times …",
  availabilityFailed: "Free times cannot be loaded right now.",
  retry: "Try again",
  confirm: "Review booking",
  review: "Check your booking",
  change: "Change",
  book: "Confirm demo booking",
  submitting: "Saving your booking …",
  lockedNote: "Please wait: the request is being sent. Selection and navigation are locked until then.",
  uncertainTitle: "We could not confirm whether your booking was saved.",
  uncertainText: "Send it again: exactly the same request is repeated, so no double booking can happen.",
  resend: "Send again",
  abandon: "Cancel",
  errors: {
    time_conflict: "This time has just been taken. Please choose another one.",
    room_not_reservable: "This room cannot be booked right now. Please choose another room.",
    date_out_of_range: "This date is outside the demo period (today and the next 13 days).",
    invalid_time: "This time cannot be booked (08:00–20:00).",
    grid: "Bookings are possible in 15-minute steps for 15 to 120 minutes only.",
    in_past: "This start time is now in the past. Please choose a later one.",
    generic: "The request could not be processed. Please try again.",
  },
  guardTitle: "Booking still in progress",
  guardText:
    "Your booking is being saved or its result is still unclear. If you leave now, it may still exist – but the booking ID and cancellation code will be lost and you cannot cancel it yourself.",
  stay: "Stay here",
  leave: "Leave anyway",
  mapLink: "Show this room on the map",
  scheduleLink: "Classes in this room",
  cancelLink: "Cancel a booking",
  receipt: {
    success: "Booking saved",
    id: "Booking ID",
    code: "Cancellation code",
    noRecovery:
      "Important: write down or photograph the ID and code now. They are not stored anywhere and not sent to you. You need both to cancel yourself.",
    countdown: (s: number) => `This receipt will be hidden in ${s} seconds.`,
    more: "More time",
    finish: "Done",
  },
  cancel: {
    id: "Booking ID",
    code: "Cancellation code",
    go: "Confirm cancellation",
    pending: "Sending cancellation …",
    done: "The booking has been cancelled.",
    badId: "The booking ID does not have the right format. Please check it.",
    unauthorized: "The cancellation code does not have the right format. Please check it.",
    not_found: "ID and code do not match any booking. Please check both.",
    booking_ended: "This booking has already ended and can no longer be cancelled.",
    busy: "The system is busy right now. Please try again in a moment.",
    generic: "The cancellation could not be sent. Please try again.",
    back: "Back to room booking",
    demo: "DEMO – not an official university booking system.",
  },
};

export const BOOKING_COPY: Record<Lang, BookingCopy> = { de, en };

export type BookingErrorKey = keyof BookingCopy["errors"];

/** Maps an API error/detail code to a translated message key (never the server's German text). */
export function bookingErrorKey(error: unknown, detail: unknown): BookingErrorKey {
  if (error === "time_conflict" || error === "room_not_reservable") return error;
  if (error === "validation" && (detail === "date_out_of_range" || detail === "invalid_time" || detail === "grid" || detail === "in_past")) return detail;
  return "generic";
}
