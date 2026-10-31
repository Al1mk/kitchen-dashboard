import type { FloorId } from "../rooms/schema.ts";
import { TEAM_DEMO_ROOMS } from "./team-catalog.ts";

// Static map geometry (docs/contracts.md C1). Safe for client and server code.
// The floor images are Aryan's illustrations (AI-generated per the source, not
// verified campus plans). Positions are bound to stable room ids, never to the
// editable room code; current names/floors/flags come from /api/public/rooms.

export type MapFloor = {
  floorId: FloorId;
  /** Public URL of the floor image. */
  image: string;
  /** Intrinsic image size in pixels (aspect ratio of the drawing area). */
  width: number;
  height: number;
};

/** Normalized position on its floor image: origin top-left, x right, y down, 0–1 inclusive. */
export type RoomMapPosition = { roomId: string; floorId: FloorId; x: number; y: number };

export const MAP_FLOORS: readonly MapFloor[] = [
  { floorId: "1OG", image: "/map-demo/assets/1OG.png", width: 1804, height: 872 },
  { floorId: "2OG", image: "/map-demo/assets/2OG.png", width: 1808, height: 870 },
  { floorId: "3OG", image: "/map-demo/assets/3OG.png", width: 1550, height: 1015 },
];

export const ROOM_POSITIONS: readonly RoomMapPosition[] = TEAM_DEMO_ROOMS.flatMap((room) =>
  room.position ? [{ roomId: room.id, floorId: room.floorId, x: room.position.x, y: room.position.y }] : [],
);

const positionsById = new Map(ROOM_POSITIONS.map((p) => [p.roomId, p]));

export function mapFloor(floorId: string): MapFloor | null {
  return MAP_FLOORS.find((f) => f.floorId === floorId) ?? null;
}

export function isNormalized(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export type MarkerState =
  | { ok: true; position: RoomMapPosition; floor: MapFloor }
  | { ok: false; reason: "no_position" | "floor_changed" | "no_floor_image" };

/**
 * Where (if anywhere) to draw a room on the map, from its *current* public data.
 * A position recorded for another floor is never moved onto the new floor's image.
 */
export function markerFor(room: { id: string; floorId: string }): MarkerState {
  const floor = mapFloor(room.floorId);
  const position = positionsById.get(room.id);
  if (!position || !isNormalized(position.x) || !isNormalized(position.y)) return { ok: false, reason: "no_position" };
  if (position.floorId !== room.floorId) return { ok: false, reason: "floor_changed" };
  if (!floor) return { ok: false, reason: "no_floor_image" };
  return { ok: true, position, floor };
}

/** Problems in the static configuration; empty when it is consistent. */
export function validateMapConfig(floors: readonly MapFloor[] = MAP_FLOORS, positions: readonly RoomMapPosition[] = ROOM_POSITIONS): string[] {
  const problems: string[] = [];
  const floorIds = new Set(floors.map((f) => f.floorId));
  if (floorIds.size !== floors.length) problems.push("duplicate floor id");
  for (const f of floors) if (!(f.width > 0 && f.height > 0)) problems.push(`invalid size for ${f.floorId}`);
  const seen = new Set<string>();
  for (const p of positions) {
    if (seen.has(p.roomId)) problems.push(`duplicate position for ${p.roomId}`);
    seen.add(p.roomId);
    if (!floorIds.has(p.floorId)) problems.push(`${p.roomId}: floor ${p.floorId} has no image`);
    if (!isNormalized(p.x) || !isNormalized(p.y)) problems.push(`${p.roomId}: coordinates outside 0–1`);
  }
  return problems;
}
