# V2 Stage 1 evidence — AL-01 preparation and AL-02 (3 November 2026)

Stage 1 of [`02-ali-claude-prompts.md`](../../plans/v2-team-2026-11-03/02-ali-claude-prompts.md): the portrait-kiosk bottom navigation dock, lowered language switch, scoped kiosk scale, reserved space, and the shared layout contract. Implemented by Claude Code in Ali's checkout (AI-assisted, disclosed), **uncommitted** on `main` at `a7903db`. Everything here is **nominal emulation in headless Chromium 156 against isolated copies with disposable databases**: it is not the physical Elo screen, not a reach or touch-hardware test and not a usability study. No improvement in task success, time or satisfaction is claimed.

## Files

| File | Content |
| --- | --- |
| [`baseline.md`](baseline.md) | Source state, manifest hashes, protected-data state, the read-only hardware check |
| [`measurements.md`](measurements.md) | Generated before/after tables (dock, sizes, clearance, booking button vs dock, board states) |
| [`reza-packet.md`](reza-packet.md) | Problem → evidence → decision → files → before/after → result → limits, for the documentation editor |
| `before/` , `after/` | `screens/<context>/*.png` and `data/<context>/*.json` (same script, contexts, languages and synthetic data; `data/_index.json` lists all 106 page records per set) |
| `logs/` | Sanitised run logs: red runs, mutation runs, captures. A file named `…STALE-BUILD-not-valid.log` is kept on purpose (see below) |

Contexts: `kiosk-touch-1080x1920` (touch emulation on), `kiosk-pointer-1080x1920` (**touch off**, i.e. pointer-fine portrait), `sens-1080x1700` (assumes ≈ 220 px lost to browser chrome), `sens-540x960` (what a 200 % zoom would report), `laptop-1440x900`, `phone-390x844`. The two `sens-` contexts are **assumptions**, not measurements.

Receipt and cancel-form screenshots mask the booking number, cancellation code and every input (magenta boxes); no tracing, video or HAR was recorded; the isolated servers' temporary admin credential was written to a mode-600 file outside the repository and deleted. A credential-word scan of `logs/` found nothing. No device photo, serial number or system inventory is included.

## What changed (runtime files)

`src/components/public/PublicShell.tsx`, `PublicNav.tsx`, `src/components/display/BoardLayout.tsx`, `src/app/globals.css`; new `src/components/public/DockHeightSync.tsx` and `src/lib/public-layout.ts`. New tests `tests/e2e/kiosk-dock.spec.ts` (19) and `tests/unit/public-kiosk-layout.test.ts` (3). **No existing test, page file, i18n string, API, schema, admin component or teammate-owned module (`CampusMap`, booking, `DaySchedule`, `newcomers/content.ts`) was edited.** Contract: [`docs/contracts.md` C10](../../contracts.md); handoff: [`03-stage-1-layout-handoff.md`](../../plans/v2-team-2026-11-03/03-stage-1-layout-handoff.md).

## Actual results (Stage 1 run, 3 November 2026)

Run from an isolated copy of the **actual modified source** (runtime-manifest hash `ea6c27d32152c5bc`, equal to the working tree), clean `.next`, port 3100 for E2E, nothing else listening.

| Check | Result |
| --- | --- |
| `next typegen` + `tsc --noEmit` | exit 0 |
| `eslint` (whole project incl. audit scripts, 185 files) | 0 errors, 0 warnings |
| `vitest run` | 20 files, **155/155** passed (152 existing + 3 new) |
| `next build` | exit 0 |
| `playwright test` (full suite) | **94/94** passed (75 existing + 19 new), 0 failed, 0 skipped |
| Restart validation (13 checks) | **NOT RUN** in Stage 1 (planned for the final stage) |

The historical figures (152 unit, 75 browser, 13 restart, 1 November) are separate from these runs and unchanged.

**Red before green.** The new spec was run against the V1 build first (`logs/01`): 15 of 19 failed, 4 passed. Two of the 15 failures were flaws in my own first version of the spec (the schedule page has a second `<nav>`, the day selector, which my query also matched); after scoping the query to the primary navigation those two ordinary-layout tests passed on V1 as they must (`logs/02`), so the V1 baseline for 'ordinary layouts retained' is a passing result. The other 13 failures were the intended ones: row not centred, no dock, no reserved space, root 16 px, no non-colour cue, course-title note on booking, board navigation not below the list, confirm button not above a dock. The admin-preview and search/Back/Forward tests passed on V1 too. The keyboard-focus test also passed on V1, but only vacuously (V1 has no dock), which is why it was mutation-checked below. The new unit test failed first because its module did not exist (`logs/03`).

**Mutation checks** (a deliberately wrong copy must make the guards fail): removing the dock reservation and left-aligning the second row failed 4 tests (`04`); the first focus walk was too weak — it passed on the broken build because it only saw the dock's own tab stops — so it was rewritten (110 forward stops, a minimum number of page-content stops, plus Shift+Tab to the last control) and then failed on the broken build and passed on the good one (`05`–`07`); making the kiosk rule depend on `pointer: coarse` failed both the unit test and the pointer-fine E2E context (`08`, `10`). **`09` is kept as an invalid run:** it executed against a build made before the mutation and therefore passed wrongly; the valid run is `10`.

## Before → after (nominal 1080×1920, German; full table in `measurements.md`)

| | Before (V1) | After (Stage 1) |
| --- | --- | --- |
| Navigation top / language switch top | 111 px / 30 px (top 13 %) | 1733 px / 1627 px (bottom, dock 311 px = 16 %) |
| Rows | 4 + 3, left-aligned, in the header | 4 + 3, second row centred (±2 px of 540, asserted), language switch above them |
| Content column / body / H1 / smallest text / tile height | 728 px / 18 px / 36 px / 14 px / 56 px | 1001 px / 24.75 px / 49.5 px / 19.3 px / 77 px |
| Language buttons gap | 4 px | 16.5 px (8 px on laptop and phone) |
| Active destination / language | colour only | colour + bar / underline |
| Shared English "course titles" note | on every non-start page | only on schedule and rooms |
| Laptop 1440×900 and phone 390×844 | — | same sizes, nothing pinned, no dock box, 16 px root (asserted); document length within 1 %; **one pixel-level difference: the navigation sits 4 px lower** (110.7 → 114.7 px on the laptop, 184.7 → 188.7 px on the phone) because it now shares the header's flex row, whose gap is 16 px instead of the former 12 px padding; the language switch is at the same position |
| Horizontal overflow, last content under the dock | — | 0 of 106 captured page records overflow or end under the dock |

Open the matched pairs, for example `before/screens/kiosk-touch-1080x1920/home-de.png` and `after/screens/kiosk-touch-1080x1920/home-de.png`; likewise `rooms`, `booking`, `map`, `display-many`, `booking-receipt`, `cancel-form`, `display-error`, and the `sens-540x960`, `sens-1080x1700` and `kiosk-pointer-1080x1920` sets.

## Limitations and side effects

- **Physical screen unavailable** (0 Elo USB devices, 1 built-in display seen by a read-only check): viewport, zoom, DPR, mounting height, reach and touch are **not measured**; T35 stays WAITING_HUMAN; all sizes are provisional design choices.
- The dock is 16 % of a 1920 px viewport, 18 % of 1700 px and 24 % of 960 px (227 px).
- The larger text lengthens pages (`/rooms` 8.56 → 11.85 screens; the booking confirm button lies further below the fold, 2938 px vs 2271 px) and enlarges map markers (24 → 31.5 px high) that stay under 44 px (21 of 21, unchanged count) and still visibly overlap in the screenshot (not re-measured): owners Parsa (AP-03) and Aryan (AP-01).
- The dock is first in DOM/tab order although drawn last (skip link planned for Stage 3); keyboard focus clearance is tested at 1080×1700 and 540×960 only; `scrollIntoView` was not tested.
- Chromium only; no Firefox/WebKit; no screen-reader, forced-colours, reduced-motion or on-screen-keyboard check; native select/date pop-ups not inspected; the receipt phase is still unguarded (AP-02); no human check of any kind.
