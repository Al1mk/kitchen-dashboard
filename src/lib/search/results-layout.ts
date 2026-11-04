/**
 * How /rooms orders the two result groups of ONE query (V2 Stage 2, docs/contracts.md C11).
 *
 * A query is searched twice: as a room (code or name) and as a class of the selected day (course title or
 * lecturer). When no room matches but classes do, a leading "no room found" box would contradict the
 * matching classes the visitor is actually looking for. So:
 *
 * - at least one room matches → rooms first (the classes follow, as before);
 * - no room matches → the classes lead, in every class state, so the order never flips when the class
 *   request settles; the (empty) room group follows;
 * - the room group's message: nothing while the classes are still loading (it could only flash and then
 *   disappear), "the matches are in the classes above" when classes matched, and the plain
 *   "no room matches" when nothing matched or the class request failed.
 */
export type ClassState = "loading" | "failed" | "none" | "some";
export type ResultsLayout = {
  first: "rooms" | "classes";
  roomsNote: "none" | "no-match" | "see-classes";
};

export function searchResultsLayout(roomCount: number, classes: ClassState): ResultsLayout {
  if (roomCount > 0) return { first: "rooms", roomsNote: "none" };
  if (classes === "loading") return { first: "classes", roomsNote: "none" };
  return { first: "classes", roomsNote: classes === "some" ? "see-classes" : "no-match" };
}
