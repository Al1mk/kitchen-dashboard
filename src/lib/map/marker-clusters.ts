/**
 * AP-01 (Aryan): visual decluttering for close map pins, without moving any
 * stored room coordinate. Dimensions are CSS pixels of the ACTUAL map layer,
 * not physical millimeters of the kiosk and not window.innerWidth.
 *
 * Markers are 72×44 CSS px, cluster badges are 44×44 CSS px. The small
 * 6 px gap is a layout safeguard, NOT a claimed WCAG certification.
 */
export type MapPin<T> = { id: string; x: number; y: number; room: T };
export type MarkerGroup<T> = {
  key: string;
  x: number;
  y: number;
  pins: MapPin<T>[];
};

const MARKER_WIDTH = 72;
const CLUSTER_WIDTH = 44;
const TARGET_HEIGHT = 44;
const GAP = 6;

/**
 * Agglomerate any potentially overlapping hit rectangles; repeat until stable
 * because a newly formed group is shown at its centroid (a new hit rectangle).
 * That centroid is an interaction affordance, never a substituted room position.
 * An individual pin always keeps its original normalized x,y.
 */
export function groupMapMarkers<T>(points: readonly MapPin<T>[], layerWidth: number, layerHeight: number): MarkerGroup<T>[] {
  if (!Number.isFinite(layerWidth) || !Number.isFinite(layerHeight) || layerWidth <= 0 || layerHeight <= 0) return [];
  let groups: MarkerGroup<T>[] = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1)
    .map(p => ({ key: p.id, x: p.x, y: p.y, pins: [p] }));

  const width = (g: MarkerGroup<T>) => g.pins.length > 1 ? CLUSTER_WIDTH : MARKER_WIDTH;
  const overlaps = (a: MarkerGroup<T>, b: MarkerGroup<T>) =>
    Math.abs(a.x - b.x) * layerWidth < (width(a) + width(b)) / 2 + GAP &&
    Math.abs(a.y - b.y) * layerHeight < TARGET_HEIGHT + GAP;

  // Finite: every iteration reduces the group count by one.
  for (let restart = true; restart;) {
    restart = false;
    outer: for (let i = 0; i < groups.length; i++) {
      for (let j = i + 1; j < groups.length; j++) {
        if (!overlaps(groups[i], groups[j])) continue;
        const pins = [...groups[i].pins, ...groups[j].pins].sort((a, b) => a.id.localeCompare(b.id));
        const group: MarkerGroup<T> = {
          key: pins.map(p => p.id).join("|"),
          x: pins.reduce((sum, p) => sum + p.x, 0) / pins.length,
          y: pins.reduce((sum, p) => sum + p.y, 0) / pins.length,
          pins,
        };
        groups = [...groups.slice(0, i), group, ...groups.slice(i + 1, j), ...groups.slice(j + 1)];
        restart = true;
        break outer;
      }
    }
  }
  return groups;
}
