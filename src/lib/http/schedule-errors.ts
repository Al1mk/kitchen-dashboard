import "server-only";
import { jsonError } from "../auth/request.ts";
import type { BookingBlock, SessionConflict } from "../sessions/repository.ts";
import { formatBerlinDateTime, formatBerlinTime } from "../time/berlin.ts";

// German error responses shared by the room and class-session admin routes.

export const noStore = { "Cache-Control": "no-store" };

/** "Es ist noch 1 Termin geplant" / "Es sind noch 2 Termine geplant" etc. */
function inUseText(sessions: number, bookings: number) {
  const parts: string[] = [];
  if (sessions > 0) parts.push(sessions === 1 ? "ist noch 1 Termin geplant" : `sind noch ${sessions} Termine geplant`);
  if (bookings > 0) parts.push(bookings === 1 ? "ist noch 1 Reservierung aktiv" : `sind noch ${bookings} Reservierungen aktiv`);
  const what = `Es ${parts.join(" und es ")}`;
  const todo = [
    sessions > 0 ? `verlegen oder absagen Sie ${sessions === 1 ? "den Termin" : "die Termine"}` : null,
    bookings > 0 ? `stornieren Sie ${bookings === 1 ? "die Reservierung" : "die Reservierungen"} unter „Reservierungen“` : null,
  ].filter(Boolean).join(" und ");
  return `Der Raum kann nicht archiviert werden: ${what}. Bitte ${todo} zuerst.`;
}

export function roomError(
  reason: "not_found" | "duplicate_code" | "already_archived" | "not_archived" | "in_use" | "booking_in_use",
  upcoming: { sessions: number; bookings: number } = { sessions: 0, bookings: 0 },
) {
  switch (reason) {
    case "not_found":
      return jsonError(404, "not_found", "Raum nicht gefunden.");
    case "duplicate_code":
      return jsonError(409, "duplicate_code", "Diese Raumnummer ist bereits vergeben.", {
        fieldErrors: { code: ["Diese Raumnummer ist bereits vergeben (auch archivierte Räume zählen)."] },
      });
    case "booking_in_use":
      return jsonError(409, "booking_in_use", "„Reservierbar“ kann nicht abgeschaltet werden, solange noch Reservierungen für diesen Raum anstehen. Bitte diese zuerst unter „Reservierungen“ stornieren.", {
        fieldErrors: { reservable: ["Es gibt noch anstehende Reservierungen für diesen Raum."] },
      });
    case "already_archived":
      return jsonError(409, "already_archived", "Der Raum ist bereits archiviert.");
    case "not_archived":
      return jsonError(409, "not_archived", "Der Raum ist nicht archiviert.");
    case "in_use":
      return jsonError(409, "room_in_use", inUseText(upcoming.sessions, upcoming.bookings), {
        upcomingSessions: upcoming.sessions,
        upcomingBookings: upcoming.bookings,
      });
  }
}

function conflictText(conflict: SessionConflict) {
  return `Der Raum ist bereits belegt: „${conflict.title}“ am ${formatBerlinDateTime(conflict.startsAt)}–${formatBerlinTime(new Date(conflict.endsAt))} Uhr.`;
}

export function sessionError(
  failure:
    | { reason: "not_found" | "not_scheduled" | "not_cancelled" | "room_not_found" | "room_archived" }
    | { reason: "conflict"; conflict: SessionConflict }
    | { reason: "booking_conflict"; conflict: BookingBlock },
) {
  switch (failure.reason) {
    case "not_found":
      return jsonError(404, "not_found", "Termin nicht gefunden.");
    case "not_scheduled":
      return jsonError(409, "not_scheduled", "Dieser Termin ist bereits abgesagt.");
    case "not_cancelled":
      return jsonError(409, "not_cancelled", "Dieser Termin ist nicht abgesagt.");
    case "room_not_found":
      return jsonError(400, "validation", "Bitte die markierten Felder prüfen.", { fieldErrors: { roomId: ["Dieser Raum existiert nicht."] } });
    case "room_archived":
      return jsonError(409, "room_archived", "Der gewählte Raum ist archiviert.", {
        fieldErrors: { roomId: ["Dieser Raum ist archiviert. Bitte einen aktiven Raum wählen oder den Raum wiederherstellen."] },
      });
    case "booking_conflict": {
      const text = `Der Raum ist zu dieser Zeit durch eine Demo-Reservierung belegt (${formatBerlinDateTime(failure.conflict.startsAt)}–${formatBerlinTime(new Date(failure.conflict.endsAt))} Uhr). Sie wird nicht automatisch storniert.`;
      return jsonError(409, "booking_conflict", text, { conflict: failure.conflict, fieldErrors: { roomId: [text] } });
    }
    case "conflict":
      return jsonError(409, "room_conflict", conflictText(failure.conflict), {
        conflict: failure.conflict,
        fieldErrors: { roomId: [conflictText(failure.conflict)] },
      });
  }
}
