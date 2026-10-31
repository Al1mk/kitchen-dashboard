import { jsonError } from "../auth/request.ts";
import type { BookingFailure } from "./repository.ts";

const messages: Record<BookingFailure, string> = {
  validation: "Bitte Datum, Raum und Uhrzeit prüfen.",
  not_found: "Reservierung nicht gefunden oder Stornierungscode ungültig.",
  room_not_reservable: "Dieser Raum ist nicht zur Reservierung freigegeben.",
  time_conflict: "Der Zeitraum ist inzwischen belegt. Bitte neu auswählen.",
  request_id_reused: "Diese Anfrage-ID wurde bereits für eine andere Reservierung verwendet.",
  booking_ended: "Die Reservierung ist bereits beendet.",
};
export function bookingError(reason: BookingFailure, detail?: string) {
  const status = reason === "validation" ? 400 : reason === "not_found" ? 404 : 409;
  return jsonError(status, reason, detail ?? messages[reason]);
}
export function bookingUnavailable(error: unknown): Response {
  // Never print body, tokens or SQL internals to a public response.
  if (error && typeof error === "object" && "code" in error &&
      typeof error.code === "string" && /^(SQLITE_BUSY|SQLITE_LOCKED)/.test(error.code)) {
    return jsonError(503, "temporarily_unavailable", "System beschäftigt. Bitte erneut versuchen.");
  }
  throw error;
}
