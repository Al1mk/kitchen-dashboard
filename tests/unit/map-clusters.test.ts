import { describe, expect, test } from "vitest";
import { groupMapMarkers } from "../../src/lib/map/marker-clusters.ts";
import { TEAM_DEMO_ROOMS } from "../../src/lib/map/team-catalog.ts";

const floorPins = (floorId: string) => TEAM_DEMO_ROOMS.filter(r => r.floorId === floorId && r.position)
  .map(r => ({ id: r.id, room: r, x: r.position!.x, y: r.position!.y }));
const dimensions = { "1OG": 872 / 1804, "2OG": 870 / 1808, "3OG": 1015 / 1550 };

const boxesDoNotOverlap = <T,>(groups: ReturnType<typeof groupMapMarkers<T>>, w: number, h: number) => {
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) {
    const a = groups[i], b = groups[j];
    const aw = a.pins.length > 1 ? 44 : 72;
    const bw = b.pins.length > 1 ? 44 : 72;
    const touchingX = Math.abs(a.x - b.x) * w < (aw + bw) / 2;
    const touchingY = Math.abs(a.y - b.y) * h < 44;
    expect(touchingX && touchingY, `${a.key} overlays ${b.key}`).toBe(false);
  }
};

describe("AP-01 visual cluster geometry", () => {
  for (const floor of ["1OG", "2OG", "3OG"] as const) for (const width of [500, 728, 1000, 1500, 2184]) {
    test(`${floor} at map layer width ${width}: no 72x44 / 44x44 clickable rectangles overlap`, () => {
      const original = floorPins(floor);
      const output = groupMapMarkers(original, width, width * dimensions[floor]);
      expect(output.flatMap(g => g.pins.map(p => p.id)).sort()).toEqual(original.map(p => p.id).sort());
      boxesDoNotOverlap(output, width, width * dimensions[floor]);
      for (const group of output) if (group.pins.length === 1) {
        expect(group.x).toBe(group.pins[0].x);
        expect(group.y).toBe(group.pins[0].y);
      }
    });
  }
  test("K1-115 and K1-118 can be selected separately from same cluster at 500px", () => {
    const groups = groupMapMarkers(floorPins("1OG"), 500, 500 * dimensions["1OG"]);
    const group = groups.find(g => g.pins.some(p => p.room.code === "K1-115"));
    expect(group?.pins.some(p => p.room.code === "K1-118")).toBe(true);
    expect(group?.pins.some(p => p.room.code === "K1-115")).toBe(true);
  });
  test("algorithm neither mutates room coordinates nor invents room ids", () => {
    const pins = floorPins("1OG");
    const before = JSON.stringify(pins);
    groupMapMarkers(pins, 500, 500 * dimensions["1OG"]);
    expect(JSON.stringify(pins)).toEqual(before);
  });
});
