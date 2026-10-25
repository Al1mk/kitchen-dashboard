import { z } from "zod";
import { toFieldErrors, type FieldErrorMap } from "../validation.ts";

// Shared room contract. Safe to import from client and server code.
// Floor ids are a working assumption (three floors, see docs/contracts.md);
// they still need to be confirmed with the map team (Arian, Parsa).

export const FLOORS = [
  { id: "EG", label: "Erdgeschoss" },
  { id: "1OG", label: "1. Obergeschoss" },
  { id: "2OG", label: "2. Obergeschoss" },
] as const;
export type FloorId = (typeof FLOORS)[number]["id"];
export const FLOOR_IDS = FLOORS.map((f) => f.id) as [FloorId, ...FloorId[]];
export const FLOOR_LABELS = Object.fromEntries(FLOORS.map((f) => [f.id, f.label])) as Record<FloorId, string>;

export const ROOM_TYPES = ["lecture", "seminar", "lab", "study", "common", "office", "other"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];
export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  lecture: "Hörsaal",
  seminar: "Seminarraum",
  lab: "Labor / PC-Raum",
  study: "Lern- / Gruppenraum",
  common: "Aufenthalt / Küche",
  office: "Büro",
  other: "Sonstiges",
};

export const ROOM_CODE_MAX = 20;
export const ROOM_NAME_MAX = 80;
export const ROOM_DESCRIPTION_MAX = 500;

/** Editable room data. The stable id, demo flag and archive state are not part of it. */
export type RoomContent = {
  code: string;
  name: string;
  floorId: FloorId;
  type: RoomType;
  description: string;
  reservable: boolean;
  /** Optional English versions for the public English interface; "" = none. */
  nameEn: string;
  descriptionEn: string;
};

/** Public projection: the only room fields anonymous visitors (and the map) receive. */
export type PublicRoom = {
  id: string;
  code: string;
  name: string;
  floorId: FloorId;
  type: RoomType;
  description: string;
  reservable: boolean;
  isDemo: boolean;
  /** null = no English version; the English interface shows the German text and says so. */
  nameEn: string | null;
  descriptionEn: string | null;
};

const inputSchema = z.object({
  code: z
    .string({ error: "Bitte eine Raumnummer eingeben." })
    .trim()
    .min(1, "Bitte eine Raumnummer eingeben.")
    .max(ROOM_CODE_MAX, `Die Raumnummer darf höchstens ${ROOM_CODE_MAX} Zeichen lang sein.`)
    .regex(
      /^[\p{L}\p{N}][\p{L}\p{N} .\-/]*$/u,
      "Die Raumnummer darf nur Buchstaben, Ziffern, Leerzeichen, Punkt, Bindestrich und Schrägstrich enthalten.",
    ),
  name: z
    .string({ error: "Bitte einen Namen eingeben." })
    .trim()
    .min(1, "Bitte einen Namen eingeben.")
    .max(ROOM_NAME_MAX, `Der Name darf höchstens ${ROOM_NAME_MAX} Zeichen lang sein.`),
  floorId: z.enum(FLOOR_IDS, { error: "Bitte ein Stockwerk wählen." }),
  type: z.enum(ROOM_TYPES, { error: "Bitte eine Raumart wählen." }),
  description: z
    .string({ error: "Ungültige Beschreibung." })
    .trim()
    .max(ROOM_DESCRIPTION_MAX, `Die Beschreibung darf höchstens ${ROOM_DESCRIPTION_MAX} Zeichen lang sein.`)
    .optional()
    .default(""),
  reservable: z.boolean({ error: "Ungültiger Wert für „Reservierbar“." }),
  nameEn: z
    .string({ error: "Ungültiger englischer Name." })
    .trim()
    .max(ROOM_NAME_MAX, `Der englische Name darf höchstens ${ROOM_NAME_MAX} Zeichen lang sein.`)
    .optional()
    .default(""),
  descriptionEn: z
    .string({ error: "Ungültige englische Beschreibung." })
    .trim()
    .max(ROOM_DESCRIPTION_MAX, `Die englische Beschreibung darf höchstens ${ROOM_DESCRIPTION_MAX} Zeichen lang sein.`)
    .optional()
    .default(""),
});

/** Admin form input (strings and a boolean). */
export type RoomInput = z.input<typeof inputSchema>;
export type RoomFieldErrors = FieldErrorMap<keyof RoomContent>;

export type RoomParseResult = { ok: true; content: RoomContent } | { ok: false; fieldErrors: RoomFieldErrors };

export function parseRoomInput(raw: unknown): RoomParseResult {
  const result = inputSchema.safeParse(raw);
  if (!result.success) return { ok: false, fieldErrors: toFieldErrors(result.error.issues) };
  const v = result.data;
  return {
    ok: true,
    content: {
      code: v.code,
      name: v.name,
      floorId: v.floorId,
      type: v.type,
      description: v.description,
      reservable: v.reservable,
      nameEn: v.nameEn,
      descriptionEn: v.descriptionEn,
    },
  };
}

/** Natural order for room codes: "1.9" before "1.10". */
export function compareRoomCodes(a: string, b: string): number {
  return a.localeCompare(b, "de", { numeric: true, sensitivity: "base" });
}
