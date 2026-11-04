import { describe, expect, it } from "vitest";
import { HOME_SECTIONS, NEWCOMER_PICTOGRAM, PICTOGRAM_NAMES } from "../../src/lib/public-pictograms.ts";
import { PUBLIC_TEXT } from "../../src/lib/i18n/public.ts";
import { NEWCOMER_CARDS } from "../../src/lib/newcomers/content.ts";

// V2 Stage 2 (AL-03): Home and Newcomers show a pictogram next to every text label. The pictograms are
// hand-drawn inline SVGs (no icon dependency) and never replace the label. These checks keep the registry
// complete when a destination or a newcomer card is added.

describe("public pictograms", () => {
  it("Home shows the six destinations after Start, in the navigation's order", () => {
    const sections = Object.keys(PUBLIC_TEXT.de.sections).filter((key) => key !== "start");
    expect([...HOME_SECTIONS].sort()).toEqual([...sections].sort());
    expect(HOME_SECTIONS).toHaveLength(6);
  });

  it("every Home destination has a pictogram and a German and English one-line description", () => {
    for (const section of HOME_SECTIONS) {
      expect(PICTOGRAM_NAMES, section).toContain(section);
      for (const lang of ["de", "en"] as const) {
        expect(PUBLIC_TEXT[lang].start.tiles[section], `${lang} ${section}`).toBeTruthy();
        expect(PUBLIC_TEXT[lang].sections[section], `${lang} ${section}`).toBeTruthy();
      }
    }
  });

  it("every newcomer card id (Reza's content file) maps to a known pictogram", () => {
    for (const card of NEWCOMER_CARDS) expect(PICTOGRAM_NAMES, card.id).toContain(NEWCOMER_PICTOGRAM[card.id]);
  });

  it("the newcomer page has four primary cards and one help card", () => {
    expect(NEWCOMER_CARDS.filter((card) => card.id !== "help")).toHaveLength(4);
    expect(NEWCOMER_CARDS.filter((card) => card.id === "help")).toHaveLength(1);
  });
});
