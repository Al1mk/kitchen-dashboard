import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";
import { MAP_FLOORS, markerFor, ROOM_POSITIONS, validateMapConfig } from "../../src/lib/map/config.ts";
import { TEAM_DEMO_ROOMS } from "../../src/lib/map/team-catalog.ts";
import { ROOM_TYPES } from "../../src/lib/rooms/schema.ts";

// The generated catalog must stay identical to the imported map source files.
const sandbox: { window: Record<string, unknown> } = { window: {} };
vm.runInNewContext(readFileSync("public/map-demo/data.js", "utf8"), sandbox);
vm.runInNewContext(readFileSync("public/map-demo/room-config.js", "utf8"), sandbox);
type Place = { code: string; floor: string; name: string; nameEn: string; category: string; x: number | null; y: number | null };
const places = (sandbox.window.K1_DATA as { places: Place[] }).places;
const bookable = sandbox.window.LCC_BOOKABLE_CODES as string[];

function pngSize(path: string) {
  const bytes = readFileSync(path);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe("team catalog matches the imported map source", () => {
  it("has the 48 entries of the joint map, in source order, field for field", () => {
    expect(TEAM_DEMO_ROOMS).toHaveLength(48);
    TEAM_DEMO_ROOMS.forEach((room, i) => {
      const p = places[i];
      expect(room).toMatchObject({ code: p.code, floorId: p.floor, name: p.name, nameEn: p.nameEn, type: p.category });
      expect(room.position).toEqual(p.x === null || p.y === null ? null : { x: p.x, y: p.y });
    });
  });

  it("keeps Aryan's 47 positions (21/18/8 per floor) and leaves K1-114 unpositioned", () => {
    expect(ROOM_POSITIONS).toHaveLength(47);
    const perFloor = Object.fromEntries(MAP_FLOORS.map((f) => [f.floorId, ROOM_POSITIONS.filter((p) => p.floorId === f.floorId).length]));
    expect(perFloor).toEqual({ "1OG": 21, "2OG": 18, "3OG": 8 });
    const k114 = TEAM_DEMO_ROOMS.find((r) => r.code === "K1-114")!;
    expect(k114.position).toBeNull();
    expect(ROOM_POSITIONS.some((p) => p.roomId === k114.id)).toBe(false);
  });

  it("uses deterministic, unique opaque ids and supported room types", () => {
    expect(new Set(TEAM_DEMO_ROOMS.map((r) => r.id)).size).toBe(48);
    for (const room of TEAM_DEMO_ROOMS) {
      expect(room.id).toBe(`lcc-demo-room-${room.code.toLowerCase()}`);
      expect(ROOM_TYPES).toContain(room.type);
    }
  });

  it("marks exactly the 21 demo choices of the joint package as initially reservable", () => {
    expect(TEAM_DEMO_ROOMS.filter((r) => r.initiallyReservable).map((r) => r.code).sort()).toEqual([...bookable].sort());
    expect(bookable).toHaveLength(21);
  });
});

describe("map geometry", () => {
  it("is consistent: unique positions, known floors, coordinates in 0–1", () => {
    expect(validateMapConfig()).toEqual([]);
  });

  it("records the intrinsic size of each supplied floor image", () => {
    for (const floor of MAP_FLOORS) {
      expect(pngSize(`public${floor.image}`)).toEqual({ width: floor.width, height: floor.height });
    }
  });

  it("reports duplicate, out-of-range and unknown-floor positions", () => {
    const problems = validateMapConfig(MAP_FLOORS, [
      { roomId: "a", floorId: "1OG", x: 0.5, y: 0.5 },
      { roomId: "a", floorId: "1OG", x: 0.5, y: 0.5 },
      { roomId: "b", floorId: "1OG", x: 1.2, y: 0.5 },
      { roomId: "c", floorId: "1OG", x: Number.NaN, y: 0 },
      { roomId: "d", floorId: "EG", x: 0, y: 1 },
    ]);
    expect(problems).toEqual([
      "duplicate position for a",
      "b: coordinates outside 0–1",
      "c: coordinates outside 0–1",
      "d: floor EG has no image",
    ]);
  });

  it("draws a marker only for the room's current floor and never moves it to another image", () => {
    const k120 = "lcc-demo-room-k1-120";
    const ok = markerFor({ id: k120, floorId: "1OG" });
    expect(ok.ok && ok.floor.floorId === "1OG" && ok.position.roomId === k120).toBe(true);
    expect(markerFor({ id: k120, floorId: "3OG" })).toEqual({ ok: false, reason: "floor_changed" });
    expect(markerFor({ id: k120, floorId: "EG" })).toEqual({ ok: false, reason: "floor_changed" });
    expect(markerFor({ id: "lcc-demo-room-k1-114", floorId: "1OG" })).toEqual({ ok: false, reason: "no_position" });
    expect(markerFor({ id: "some-admin-uuid", floorId: "2OG" })).toEqual({ ok: false, reason: "no_position" });
  });
});
