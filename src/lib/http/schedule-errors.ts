import "server-only";
import { jsonError } from "../auth/request.ts";
import type { SessionConflict } from "../sessions/repository.ts";
import { formatBerlinDateTime, formatBerlinTime } from "../time/berlin.ts";

// German error responses shared by the room and class-session admin routes.

export const noStore = { "Cache-Control": "no-store" };

export function roomError(reason: "not_found" | "duplicate_code" | "already_archived" | "not_archived" | "in_use", upcoming = 0) {
  switch (reason) {
    case "not_found":
      return jsonError(404, "not_found", "Raum nicht gefunden.");
    case "duplicate_code":
      return jsonError(409, "duplicate_code", "Diese Raumnummer ist bereits vergeben.", {
        fieldErrors: { code: ["Diese Raumnummer ist bereits vergeben (auch archivierte Räume zählen)."] },
      });
    case "already_archived":
      return jsonError(409, "already_archived", "Der Raum ist bereits archiviert.");
    case "not_archived":
      return jsonError(409, "not_archived", "Der Raum ist nicht archiviert.");
    case "in_use":
      return jsonError(
        409,
        "room_in_use",
        `Der Raum kann nicht archiviert werden: Es ${upcoming === 1 ? "ist noch 1 Termin" : `sind noch ${upcoming} Termine`} geplant. Bitte verlegen oder absagen Sie ${upcoming === 1 ? "ihn" : "sie"} zuerst.`,
        { upcomingSessions: upcoming },
      );
  }
}

function conflictText(conflict: SessionConflict) {
  return `Der Raum ist bereits belegt: „${conflict.title}“ am ${formatBerlinDateTime(conflict.startsAt)}–${formatBerlinTime(new Date(conflict.endsAt))} Uhr.`;
}

export function sessionError(
  failure:
    | { reason: "not_found" | "not_scheduled" | "not_cancelled" | "room_not_found" | "room_archived" }
    | { reason: "conflict"; conflict: SessionConflict },
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
    case "conflict":
      return jsonError(409, "room_conflict", conflictText(failure.conflict), {
        conflict: failure.conflict,
        fieldErrors: { roomId: [conflictText(failure.conflict)] },
      });
  }
}
