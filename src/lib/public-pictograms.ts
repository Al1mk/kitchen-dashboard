import type { PublicSection } from "./i18n/public.ts";
import type { NewcomerCard } from "./newcomers/content.ts";

// Pictograms of the public pages (V2 Stage 2, AL-03). They are small hand-drawn inline SVGs
// (src/components/public/Pictograms.tsx), no icon dependency, and always sit next to a visible text
// label: a pictogram never replaces the label. This registry says which pictogram belongs to which
// destination, so a new destination or newcomer card cannot silently ship without one
// (tests/unit/public-pictograms.test.ts).

export const PICTOGRAM_NAMES = ["newcomers", "map", "rooms", "schedule", "booking", "display", "help"] as const;
export type PictogramName = (typeof PICTOGRAM_NAMES)[number];

/** The six destinations shown as cards on Home: every public section except Start, in the navigation's order. */
export const HOME_SECTIONS = ["newcomers", "map", "rooms", "schedule", "booking", "display"] as const satisfies readonly PublicSection[];

/** Newcomer cards (ids from Reza's content file, which this registry only reads). */
export const NEWCOMER_PICTOGRAM: Record<NewcomerCard["id"], PictogramName> = {
  rooms: "map",
  schedule: "schedule",
  notices: "display",
  booking: "booking",
  help: "help",
};
