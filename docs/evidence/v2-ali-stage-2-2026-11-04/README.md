# V2 Stage 2 evidence — Home, Newcomers, Rooms (AL-03, AL-04), 4 November 2026

Stage 2 of [`02-ali-claude-prompts.md`](../../plans/v2-team-2026-11-03/02-ali-claude-prompts.md), implemented by Claude Code (AI-assisted, disclosed) on top of the Stage 1 working tree that Codex reviewed ([review](../v2-ali-stage-1-review-2026-11-03/README.md)). **Uncommitted on `main` at `a7903db`; nothing staged, committed, pushed or deployed.** Everything is **nominal emulation in headless Chromium 156 against isolated copies with disposable databases**: not the physical Elo screen, not reach or touch, not a usability study; no improvement in success, time or satisfaction is claimed. The audit and Stage 1 evidence folders are untouched.

## Files
[`measurements.md`](measurements.md) (generated before/after tables) · [`reza-packet.md`](reza-packet.md) · `before/`, `after/` (`screens/<context>/*.png`, `data/<context>/*.json`; 60 page records each, 6 contexts × DE/EN; **before = the Stage 1 working tree**, built in isolation) · `logs/` (sanitised; scratch paths replaced; credential-word scan: no hits). Contract: [`docs/contracts.md` C11](../../contracts.md); handoff: [`04-stage-2-handoff.md`](../../plans/v2-team-2026-11-03/04-stage-2-handoff.md).

## What changed
`src/app/page.tsx` (Home cards), `src/app/newcomers/page.tsx` (layout, compact marker), `src/components/public/RoomDirectory.tsx` (floor chips, one-row actions, ordered result groups, scope sentence); new `src/components/public/Pictograms.tsx`, `src/lib/public-pictograms.ts`, `src/lib/search/results-layout.ts`; new tests `tests/e2e/stage2-layout.spec.ts` (33), `tests/unit/search-results-layout.test.ts` (5), `tests/unit/public-pictograms.test.ts` (4). **Not edited:** `newcomers/content.ts` (Reza), `CampusMap`, booking modules, `DaySchedule`, `usePolledJson`, i18n strings, APIs, schema, admin, any existing test.

## Actual results (final source, runtime-manifest `b6cc242088ec16cf`, equal to the working tree)
Fresh isolated copy, **the repository's own `playwright.config.ts`** (port 3100, own build and disposable DB):

| Check | Result |
| --- | --- |
| typecheck / whole-project lint | exit 0 / exit 0, 0 warnings |
| unit | **164/164** (155 + 9 new), 22 files |
| `next build` | exit 0 |
| E2E | **127/127** (94 existing + 33 new), 0 failed, 0 skipped |
| Restart validation | **not run** (no data/API change; planned for the final stage) |

Historical counts (152 / 75 / 13, 1 Nov) and the Stage 1 counts (155 / 94) are separate runs.

**What the earlier runs showed, nothing hidden:**
- **Red first:** the new browser spec failed 31/31 on the Stage 1 build for the intended reasons (no cards, old block present, actions not in one row, pitch 352 against ≤ 290, "no room" box leading), both unit specs failed because their modules did not exist (`logs/01`, `02`). My first fixture had a double booking (409) and was corrected before the red run counted.
- **First full run (`logs/03`): 3 failures, none a Stage 2 defect.** (1) my own EN test used a selector matching two loading statuses: fixed. (2) `insecure-origin` was refused on port 3100 because my scratch config had moved to 3110 while a review server held 3100; its port is hard-coded, and the final run used the repo config on 3100. (3) `map-integration` "markers sit on the image…" failed intermittently: **1 of 3 isolated runs on the Stage 1 build and 1 of 3 on the Stage 2 build, with the identical deviation (0.0834)** (`logs/04`, `05`); it measures a marker box right after zooming without waiting. It passed in both full runs that followed. A pre-existing flaky test in Aryan's area, **not edited** and reported.
- **Mutation checks (`logs/06`–`08`):** six deliberate regressions on a throwaway copy (rooms-first/no-room box, chips ignoring the pinned bar, actions stacked, Home not filling, help card not spanning, coloured block back) made 21 tests fail with the expected messages. The first mutated build had a type error and is kept as invalid (`06`); the help-card mutation was masked by an earlier assertion in the same test and was re-run alone (4 failed).

## Before → after (nominal 1080×1920, German; full tables in `measurements.md`)
| | Before (Stage 1) | After |
| --- | --- | --- |
| Home | single column, 6 cards of 137 px, no pictograms, ≈ 300 px empty under them | two columns, 6 cards of 380 px (313 px at 1080×1700, still one screen), 6 pictograms with text labels |
| Newcomers prototype note | coloured block, 101 px, filled | compact unfilled line, 33 px (22 px text) |
| Newcomers cards | 4 + help card half width, no pictograms | 2 × 2 + help card full width and outlined (secondary); text verbatim from `content.ts`; 5 pictograms |
| Rooms length at 1080×1920 | 11.9 screens (22,760 px); median card pitch 402 px | **8.2 screens (15,687 px); pitch 259 px**, 54/54 cards with actions in one row (audited V1: 8.56 screens) |
| Rooms length at 540×960 | 17.3 screens | 12.2 screens |
| Rooms on a phone (390 px) | 20.5 screens | 20.3 screens (actions stay stacked below 520 px) |
| Floor jump | none | 4 chips (99 px bar, pinned in kiosk); one tap lands the heading at 111 px under the bar, focus on the heading, URL and history unchanged |
| Search "HCI" (classes, no room) | "Kein Raum passt zu „HCI“" box **above** the matching class | the class leads with "Die Suche gilt nur für diesen Tag."; the room message follows and points to the classes above |
Laptop 1440×900: Rooms 18.3 → 12.6 screens and Home in two columns (ordinary layouts did change here, by design).

## Limitations
The spec's card-pitch median (352 px on Stage 1) and the capture script's (402 px) use different filters; both show the Stage 1 pitch above the new 259 px.

Physical screen not attached (read-only: 0 Elo USB entries; displays 5120×2880 and 3024×1964, not the Elo's 1080×1920): viewport, zoom, DPR, reach, touch unmeasured, T35 open; sizes provisional. Chromium only; no screen reader, Firefox, WebKit or on-screen-keyboard check; native date popup not inspected. The pinned chip bar costs 99 px (5 % of 1920 px) plus the 311 px dock. The chips are not sticky on laptops/phones. Wrapped two-line action labels at 520–640 px. Pictograms are my own simple drawings, not tested for recognisability; no photo or official logo was added or invented. Home cards duplicate the dock's destinations by design. No human check of any kind.
