# Stage 1 packet for Reza — format of `01-team-tasks-fa.md` §6

Author of the change: Ali, with Claude Code (AI-assisted implementation, disclosed). Reviewer: not yet assigned. Date: 3 November 2026. Parent tasks: T36, T37 (part), T42 (before/after for Stage 1). Task IDs: AL-01 (preparation) and AL-02. Findings: A-08, A-09, A-10, A-17 (shared note), A-19, Ali's physical-screen report FR-01. **Nothing here is a physical-screen, human-usability or participant result, and no improvement in task success or time is claimed.**

## Change 1 — bottom navigation dock (AL-02, T36)

| Field | Content |
| --- | --- |
| Problem before | On the 1080×1920 simulation every control — the seven destinations and the language switch — was in the top 13 % of the screen (navigation 111–231 px, language switch 30–88 px). Ali reported that the top is hard to reach for smaller people; the real mounting height and reach are **not measured**. |
| Evidence | Field review `docs/hci/requests/2026-11-02-physical-kiosk-review.md`; audit findings A-09/A-19 (`docs/hci/v2-audit-2026-11-03/`); measured V1 geometry in `before/data/` and `measurements.md`. Type: technical (nominal emulation) + Ali's report. |
| Decision and implementation | One fixed dock at the bottom in portrait windows ≥ 520 px: language switch on top, then four tiles and three tiles centred as a group. The existing single `<nav>` is moved by CSS (nothing duplicated). The announcement board gets the same dock inside its 9:16 frame. Smaller alternative considered: keep the top navigation and add a bottom Home bar (rejected in the audit proposal: it does not move the seven destinations). Files: `PublicShell.tsx`, `PublicNav.tsx`, `DockHeightSync.tsx` (new), `BoardLayout.tsx`, `globals.css`, `src/lib/public-layout.ts` (new). Uncommitted at the time of writing; no SHA yet. |
| Course link | Fitts' Law (course pp. 49–50): frequent targets at an edge are quick to hit; Ali's reach concern is exactly why the position matters. Consistency (pp. 80–81): the same navigation in the same place on every public page. These explain the reasoning; they do **not** show a measured benefit. |
| Before / after | `before/screens/kiosk-touch-1080x1920/home-de.png` and `after/screens/kiosk-touch-1080x1920/home-de.png` (same viewport, language, data, state). Navigation top 111 px → 1733 px, language switch 30 px → 1627 px. Same pairs for `rooms`, `booking`, `map`, `display-many` and the 540×960, 1080×1700 and pointer-fine contexts. |
| Result | Technical only: see the results table in `README.md` (typecheck, lint, unit, build, E2E; mutation checks). Human result: **NOT RUN**. |
| Limits / next owner | Real viewport, zoom, DPR, panel height and reach unknown (V2-P0, Ali + Reza). The dock is 16 % of a 1920 px viewport and 24 % at 540×960. Touch on the real panel (T35) is unresolved. It comes first in tab order although drawn last (skip link: Stage 3). |

## Change 2 — kiosk scale: text, buttons, column (AL-02, T37 part)

| Field | Content |
| --- | --- |
| Problem before | At 1080 px the content column was 728 px wide (67 % of the screen), body text 18 px, smallest text 14 px, tiles 56 px (A-08). Whether this is readable on the real panel is **unknown**. |
| Evidence | `measurements.md` §1; audit A-08. Technical. |
| Decision and implementation | In portrait windows ≥ 520 px the root size rises from 16 px (at ≤ 720 px viewport width) linearly to 22 px at 1080 px, only for pages that render `PublicShell` (admin and others keep 16 px). Everything rem-based grows together: body 24.75 px, H1 49.5 px, smallest text 19.3 px, tiles 77 px, column 1001 px. The kiosk rule uses viewport and orientation, not pointer type. Alternatives rejected: CSS `zoom`/transform (blurs text, distorts measurements). |
| Course link | Cognitive load (pp. 43–47): larger, fewer-per-screen text reduces effort for a glance-and-leave use; consistency. Reasoning only. |
| Before / after | Home: H1 36 → 49.5 px, first paragraph 18 → 24.8 px, content width 728 → 1001 px. Laptop 1440×900 and phone 390×844: unchanged (document length and sizes equal within 1 %). |
| Result | Technical only (`kiosk-dock.spec.ts` "kiosk scale is scoped"; admin root stays 16 px). Human readability on the panel: **NOT RUN**. |
| Limits / next owner | Side effect: `/rooms` grows from 8.56 to 11.85 screens, map markers grow but stay under 44 px and still overlap, the booking confirm button lies further below the fold (Aryan, Parsa, Ali Stage 2). A zero-code zoom probe on the real panel (125 % / 150 %) would tell whether this scale is right. |

## Change 3 — shared English note only where class titles appear (AL-02, T37 part)

| Field | Content |
| --- | --- |
| Problem before | The paragraph "Course titles, lecturers and study groups are shown as entered by campus staff, in German …" appeared on every non-start English page, including booking, cancel, map and the board, where no course title is shown (A-17). |
| Decision and implementation | Shown only on `schedule` and `rooms` (class titles). Kept everywhere: statuses, errors, "Only/Partly in German" markers. The German interface has no such note (unchanged). File: `PublicShell.tsx`, `BoardLayout.tsx`. No string was edited or removed from `src/lib/i18n/public.ts`. |
| Result | Technical: `kiosk-dock.spec.ts` ("course-title note appears only where class titles are shown"), existing `public-navigation.spec.ts`. Comprehension by people: **NOT RUN**. |
| Limits / next owner | The two stacked booking banners and booking-internal copy are Parsa's AP-04; Reza's newcomer text was not touched. |

## Change 4 — active state beyond colour; language-button spacing (AL-02)

| Field | Content |
| --- | --- |
| Problem before | The current destination was shown by red fill only, and the language buttons were 4 px apart (A-10, A-19). |
| Decision and implementation | Active destination: inset bar; active language: underline; language gap 4 px → 8 px on laptop and phone, 16.5 px in the dock at 1080 px (12 px at 540 px) and 16.2 px on the board at 1080 px (measured, `measurements.md`/`after/data`). `aria-current` unchanged. |
| Result | Technical: `kiosk-dock.spec.ts` ("marked by more than colour", gap assertions). |
| Limits | Not tested with colour-blind users or on the real panel; no screen-reader test was run. |

## What to attach to the booklet (suggestion only; the author writes their own section)

Matched before/after pairs listed above; `measurements.md`; the commands in `README.md`; the limitations list. Do not describe the dock as "tested with users" or "proven faster".
