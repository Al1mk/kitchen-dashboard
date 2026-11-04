import { describe, expect, it } from "vitest";
import { searchResultsLayout, type ClassState } from "../../src/lib/search/results-layout.ts";

// V2 Stage 2 (AL-04): how /rooms orders the two result groups of one query. Matching classes must
// never be contradicted by a leading "no room found" box (docs/contracts.md C11). Pure rule, so it
// is checked here without a browser; the real page is checked in tests/e2e/stage2-layout.spec.ts.

describe("searchResultsLayout", () => {
  it("shows rooms first whenever at least one room matches", () => {
    for (const classes of ["loading", "failed", "none", "some"] as ClassState[]) {
      expect(searchResultsLayout(1, classes)).toEqual({ first: "rooms", roomsNote: "none" });
      expect(searchResultsLayout(48, classes)).toEqual({ first: "rooms", roomsNote: "none" });
    }
  });

  it("puts matching classes first, and no 'no room' message, when no room matches but classes do", () => {
    expect(searchResultsLayout(0, "some")).toEqual({ first: "classes", roomsNote: "see-classes" });
  });

  it("keeps the plain 'no room matches' message when nothing else was found or the class request failed", () => {
    expect(searchResultsLayout(0, "none")).toEqual({ first: "classes", roomsNote: "no-match" });
    expect(searchResultsLayout(0, "failed")).toEqual({ first: "classes", roomsNote: "no-match" });
  });

  it("shows no message at all while the classes are still loading (so it cannot flash and contradict them)", () => {
    expect(searchResultsLayout(0, "loading")).toEqual({ first: "classes", roomsNote: "none" });
  });

  it("never reorders when the class state settles: with no room the classes stay first", () => {
    const states: ClassState[] = ["loading", "some", "none", "failed"];
    expect(new Set(states.map((s) => searchResultsLayout(0, s).first))).toEqual(new Set(["classes"]));
  });
});
