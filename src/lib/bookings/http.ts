import { jsonError } from "../auth/request.ts";
import { busyResponse } from "../http/busy.ts";
import type { ValidationDetail } from "./policy.ts";
import type { BookingFailure } from "./repository.ts";

// German messages for logs/admin; public clients translate the `error` and
// `detail` codes instead of showing `message` (docs/contracts.md C5).
const messages: Record<BookingFailure, string> = {
  validation: "Bitte Datum, Raum und Uhrzeit prüfen.",
  not_found: "Reservierung nicht gefunden oder Stornierungscode ungültig.",
  room_not_reservable: "Dieser Raum ist nicht zur Reservierung freigegeben.",
  time_conflict: "Der Zeitraum ist inzwischen belegt. Bitte neu auswählen.",
  request_id_reused: "Diese Anfrage-ID wurde bereits für eine andere Reservierung verwendet.",
  booking_ended: "Die Reservierung ist bereits beendet.",
};
export function bookingError(reason: BookingFailure, extra: { detail?: ValidationDetail; message?: string } = {}) {
  const status = reason === "validation" ? 400 : reason === "not_found" ? 404 : 409;
  return jsonError(status, reason, extra.message ?? messages[reason], extra.detail ? { detail: extra.detail } : {});
}
export const bookingUnavailable = busyResponse;
