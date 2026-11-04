# V2 proposal — direction, alternatives, tasks and acceptance checks

**Status: PROPOSAL. Nothing here is implemented, and no benefit is measured.** Prepared 3 November 2026 from the audit (`02-phase-a-findings-FROZEN.md`, `03-comparison-and-addendum.md`) for Ali's review before any implementation round. Sizes in the wireframes are **illustrative CSS pixels**; the real values must come from the physical measurements in V2-P0. Effort is relative (S/M/L), not an estimate in hours. Nothing here claims a Fitts, cognitive-load or usability benefit has been demonstrated; the course concepts explain the reasoning only.

## 1. Principles

1. **Minimal and evidence-led.** Change what the audit or Ali's field review shows; keep stable room IDs, APIs, DE/EN state handling, `suche`/`datum`/`raum`/`lang`, SEARCH-R001 behaviour and the booking rules. No new destinations, no palette change, no new dependency unless a task says so.
2. **Respect Ali's page choices.** Schedule, Announcements, the booking flow, Rooms search and Home's function stay. Where an audit finding touches them, it is a *separate, flagged decision* (see §5).
3. **Measure before sizing.** Reach, viewport, DPR and pointer type of the real panel are unknown; the first task measures them. Do not equate 1080×1920 output pixels with CSS pixels.
4. **Do not rely on `pointer: coarse`** (audit: true only because touch emulation is on). Choose the kiosk layout by viewport size and orientation, with an explicit override, never by pointer type.
5. **Physical touch is separate.** T35 (USB/driver/mapping) gates *touch acceptance*, not design or technical tests. No part of this proposal is a fix for the touch hardware.
6. **Brand baseline.** Existing provisional tokens in `DESIGN.md` (`#cd4026` red, canvas/ink neutrals, Roboto Condensed + Source Sans 3). The ui-ux-pro-max template (dark navy, Garamond) was rejected. No colour is called official. The logo is still a screenshot crop; an official vector should replace it when Ali has one.

## 2. Ranked direction

| Rank | ID | What | Evidence | Existing task | Effort |
| --- | --- | --- | --- | --- | --- |
| 1 | **V2-P0** | Measure the real panel: CSS viewport, zoom/full-screen, DPR, pointer media, reach zone; capture V1 "before" | Unknown on all counts; FR-02 | T42, T36, T20 | S (human) |
| 2 | **V2-P1** | Reachable navigation dock: 7 destinations, 4 + 3 centred, language switch lowered | Field review; A-09, A-19; all controls in the top 13 % | T36 | M |
| 3 | **V2-P6** | Booking safety and finish: confirm in view, receipt guard, readable code field, schedule→booking link, one demo notice | A-03, A-04, A-05, A-20; HE-01; CW-01 | T41 | M |
| 4 | **V2-P5** | Map markers: ≥ 44 px, no overlap | A-01 (21 of 21 markers 52.7×24 px; K1-115 hidden); HE-03 | (T24 rank 3) | M |
| 5 | **V2-P2** | Kiosk scale and copy: wider column, larger text, remove repeated prose | A-08, A-17; T37, T39, T41 | T37, T39, T41 | M |
| 6 | **V2-P4** | Rooms: floor jump chips, compact cards, result order and day-scope hint | A-02, A-12; T40 | T40 | S–M |
| 7 | **V2-P3** | Home and Newcomers: larger cards, pictograms, image slot, lower focus | A-08, A-09; T38, T39 | T38, T39 | M |
| 8 | **V2-P7** | `/display`: "more below" cue only | A-07 | (T41, preserve) | S |
| 9 | **V2-P8** | Accessibility cluster | A-13, A-14, A-15, A-19 | T37 | S |
| 10 | **V2-P9** | Decisions, not code: idle reset, typing strategy, receipt time | A-06, A-11, HE-06 | T42, T35 | – |

**Smallest useful first batch:** V2-P0, P1, P6, P5, P2. The rest can follow after Ali's review and the first physical check.

Suggested order: P0 → tag/capture V1 "before" → P1 → P6 and P5 (independent) → P2 → P4, P3, P7, P8 → retest. IDs `V2-P*` are proposal labels; they are **not** on the progress board and become tasks only if Ali approves.

## 3. Tasks

### V2-P0 — Measure the real panel (human; T42 first step, T36 first checkbox)
- On the Elo screen in the browser actually used, record: `innerWidth × innerHeight`, `devicePixelRatio`, zoom level, full-screen state, `matchMedia('(pointer: coarse)')` and `(hover: none)`. With a tape measure: lower and upper edge heights of the panel and the comfortable reach band for the people who will use it. Store the numbers with date in `docs/hci/research/screen-specs.md`.
- Zero-code readability probe: with the same page open, set browser zoom to 125 % and 150 % and photograph/record what is readable at the normal standing distance. This gives a real answer about text size before any CSS changes.
- Capture V1 "before" (same pages, languages, data, browser settings as later "after").
- **Acceptance:** the NOT VERIFIED rows for viewport/zoom/DPR/reach are replaced with measured values or stay explicitly open; screenshots contain no serial number.

### V2-P1 — Reachable navigation dock (T36)

Alternatives (kiosk breakpoint only; the current top navigation stays for laptops and phones):

| | Alternative | For | Against |
| --- | --- | --- | --- |
| **A (recommended)** | Fixed bottom dock: row 1 four tiles, row 2 three tiles centred, language switch as a slim third row | Always visible, same place on every page (consistency p.80), edges/bottom suit persistent navigation (Fitts) | Covers content unless padded; competes with native pop-ups, receipts and the booking CTA; adds a fixed element to every page |
| B | In-flow nav at the end of the page content | Nothing overlaps content | On `/rooms` (8.6 screens) it is far away; position differs per page, defeats the purpose |
| C | Keep the top nav, add a bottom Home/Back bar | Smallest change | Does not move the seven destinations (Ali's request); two navigation systems |
| D | Bottom dock with five tiles + "More" | Fewer tiles | Hides two destinations; contradicts "keep all seven" and adds a menu step. **Rejected** |

Wireframe of A at 1080×1920 (illustrative):

```
y=0    ┌───────────────────────────────────────────────┐
       │ [logo]                  Lucas-Cranach-Campus │  header: identity only, no controls
       │ Räume                  (H1, larger)           │
       │ ┌───────────────────────────────────────────┐ │
       │ │ content, scrolls, max width ≈ 960         │ │
       │ │                                           │ │  main has padding-bottom = dock height
       │ └───────────────────────────────────────────┘ │  and scroll-padding-bottom
y≈1650 ├───────────────────────────────────────────────┤
       │ [Start][Neu am Campus][ Karte ][  Räume  ]    │  4 tiles
       │   [Stundenplan][Raumbuchung][Mitteilungen]    │  3 tiles centred
       │                      [ Deutsch | English ]    │  language, ≥ 8 px gaps
y=1920 └───────────────────────────────────────────────┘
```
Dock height (≈ 270 px, 14 %) and tile height are placeholders; the final values come from the reach measurement.

- **Affected files:** `src/components/public/PublicShell.tsx`, `PublicNav.tsx` (new `dock` variant), `LiveLanguageSwitch.tsx`/`LanguageSwitch` in `PublicNav.tsx`, `src/app/globals.css` (a `--dock-h` token), `src/components/display/BoardLayout.tsx` only if `/display` joins (ask Ali). Keep **one** `<nav aria-label>` in the DOM and reposition it with CSS, so existing tests that locate the navigation by role keep working.
- **Dependencies:** V2-P0 (heights), T35 for any touch acceptance.
- **Acceptance (technical):**
  1. At 1080×1920, 1080×1700 and 540×960: all seven links are in the dock; row 1 has four, row 2 three with the group centre at 540 ± 2 px; each tile at least as high as today (56 px; target from V2-P0); gaps ≥ 8 px; the language buttons ≥ 8 px apart.
  2. No focused control or selected content is under the dock: tab through every control on the eight routes in DE and EN; each focused element's bottom edge is above the dock's top edge.
  3. Parameters survive: `suche`, `datum`, `raum`, `lang` in dock links; Back/Forward unchanged.
  4. While a booking is pending/unknown, dock links still open the leave dialog.
  5. At 1440×900 and 390×844 the layout is unchanged or an intended difference is documented; no horizontal overflow anywhere.
  6. Existing suites pass unchanged (152 unit, 75 E2E, restart 13) plus a new `kiosk-dock` spec. **No existing assertion is edited to make it pass.**
- **Acceptance (physical/human, NOT RUN until done):** every tile reachable at the measured height; real taps after T35; observation with people of different reach.

### V2-P6 — Booking safety and finish (T41; items marked ◆ need Ali's decision)
- **6a Confirm in view (A-05).** After a slot is chosen, scroll the review panel into view and move focus to its confirm button (the grid above had 31 buttons in the audit; HE-05 mentions up to 48). Files: `BookingFlow.tsx`.
- **6b ◆ Receipt guard (A-03).** Alternatives: **G1 (recommended)** extend `useLeaveGuard` to the receipt phase with its own text ("Hast du Nummer und Code notiert?" / stay / leave); **G2** leave as is and document the consequence; **G3** add copy/QR/print of the credentials (larger, API/contract-adjacent). Files: `BookingFlow.tsx`, `useLeaveGuard.ts`, `booking-copy.ts`. "Fertig" must bypass the dialog.
- **6c Cancellation code input (A-04).** `type="text"` instead of `password` for a 43-character machine-generated code (◆ shoulder-surfing trade-off), `autocapitalize="off"`, `autocorrect="off"`, `spellCheck={false}`, a one-line format hint, grouped monospaced display of ID and code on the receipt. Keep the distinct "format" vs "no match" messages. Files: `BookingCancel.tsx`, `BookingReceipt.tsx`. Shortening the code or ID changes the API contract and is **out of scope** (HE-06 decision after U3/U4).
- **6d Schedule → booking (CW-01/A-20).** Add "Diesen Raum reservieren (Demo)" to the room header of `/schedule?raum=` when reservable (v2-decisions rank 1). Files: `DaySchedule.tsx`.
- **6e One demo notice (HE-01).** Merge the two stacked banners on booking. Files: `BookingFlow.tsx`, `booking-copy.ts`.
- **Acceptance:** after tapping a slot and "Weiter", the confirm button's bottom edge is inside the viewport at 1080×1700; from the receipt, a nav/dock tap opens the dialog (6b), "Stay" keeps the receipt and credentials, "Fertig" leaves; pasting a 43-character code into the cancel form works and the text is visible; the schedule room header links to booking with `raum`, `datum`, `lang`; the pending/uncertain/conflict/cancelled-replay/language tests pass **unchanged**. A human check of how people actually handle the receipt remains NOT RUN.

### V2-P5 — Map markers (A-01, HE-03)
| | Alternative | Note |
| --- | --- | --- |
| **M1 (recommended)** | Widen the plan to the kiosk column (≈ 1.3× today) and make markers at least 44 px high, resolving overlaps at render time | Keeps full room codes visible; positions in the catalog stay untouched (Aryan's data) |
| M2 | List first: search and a floor-sorted list above the plan, markers secondary | Already works for selection; less map-centric |
| M3 | Numbers only on the plan ("120"), full code in the panel | Shorter chips, but breaks the visible match with signage "K1-120" (mental model p.56) |

- **Affected files:** `CampusMap.tsx` (marker classes at line 297, plan container), `globals.css` if a token is added. No change to `team-catalog.ts`/`team-seed.ts` positions.
- **Acceptance:** on all four floors at 1080 and 540 px widths every marker has min(width, height) ≥ 44 px and **zero pairwise overlap** (the `06-map-crop-overlap.mjs` logic becomes a spec); tapping the centre of K1-115 and K1-118 on the first floor selects the right room; selection, floor change clearing the selection, search and list behaviour are unchanged; existing map tests pass. Floors 0, 2 and 3 are **unmeasured** today and must be measured first.

### V2-P2 — Kiosk scale and copy (T37, T39, T41)
- **Zero-code check first:** V2-P0's zoom probe tells whether the existing 18 px body text is readable on the panel.
- **Scale (kiosk breakpoint only):** widen the content column (today 728 px; `/display` already uses ≈ 980 px) and raise body/helper/heading sizes; target sizes (body ≈ 22–24, H1 ≈ 48, no helper text under 20) are **proposals to confirm on the panel**. Rejected: CSS `zoom` or scaling transforms (blurs text, distorts measurements).
- **Copy (strings to decide with Ali, Reza for newcomer text):**
  - Remove the English/German "Course titles, lecturers and study groups…" paragraph from the booking and cancel pages (nothing on them shows course titles); keep it only where class titles appear, in a readable size.
  - Merge the two booking banners (see 6e); remove the large purple block on Newcomers (T39) and keep a compact "Prototyp · Beispieldaten" marker and the per-item `Beispiel` badges.
  - Keep: labels, dates, cancelled-class status, validation errors, countdown and receipt instructions, fallback-translation markers.
- **Files:** `src/lib/i18n/public.ts`, `booking-copy.ts`, `src/lib/newcomers/content.ts` (Reza's source; keep provenance), `PublicShell.tsx`, `globals.css`.
- **Acceptance:** a string table (removed / kept / shortened, DE and EN in parity); no visible helper or body text below the agreed size on the kiosk breakpoint; DE/EN labels still match in every state; contrast measured with the audit's canvas method ≥ 4.5:1 for text; no hover-only task; laptop and phone layouts unaffected. Human readability on the real panel: NOT RUN.

### V2-P4 — Rooms (T40)
- **Alternatives:** **R3 (recommended first step)** floor jump chips (sticky, one tap per floor) + "Nach oben"; **R1** also compact cards (two actions in one row; booking stays visible but not the loudest element); **R2** collapsible floors (adds taps, rejected for a kiosk).
- **Result order and scope hint:** when the room section has 0 matches but classes exist, show the classes first (or drop the "Kein Raum passt…" box); add a plainly readable line that class search covers only the chosen day. A multi-day or "next class" search is a **separate proposal** (API change) and is not part of this task.
- **Files:** `RoomDirectory.tsx`, `src/lib/i18n/public.ts`.
- **Acceptance:** from the top of `/rooms`, one tap on a floor chip puts that floor's heading in view; unfiltered height is smaller than the audit baseline (**8.56 screens at 1080×1920, 54 rooms**; the size of the reduction is a target to agree, not a promise); the nine `room-search.spec.ts` tests, including the three SEARCH-R001 regressions, pass **unchanged**.

### V2-P3 — Home and Newcomers (T38, T39)
| | Alternative | Note |
| --- | --- | --- |
| **H1 (recommended)** | 2 × 3 grid of large cards with a pictogram, title and one short line; cards sit in the lower-middle of the screen, identity above | Uses the width; no new destinations |
| H2 | Image-led hero with the four main tasks overlaid | **Blocked:** needs a campus photo Ali supplies or approves; no photo may be invented |
| H3 | Current single column, scaled up | Smallest change, keeps the empty margins |

Newcomers: the four primary tasks as large 2 × 2 cards, the **Need help?** card kept full width (no invented contacts or hours), purple block removed. Pictograms: simple inline SVGs authored in the repo, always with a text label; no icon dependency. Files: `src/app/page.tsx`, `src/app/newcomers/page.tsx`, `src/lib/newcomers/content.ts`, shared shell. Replace the logo crop with an official vector when available.
- **Acceptance:** all six (Home) / five (Newcomers) destinations present with identical hrefs in DE and EN; cards at least the agreed size at 1080×1920 and 540×960; text contrast ≥ 4.5:1; the purple prototype string is gone and the compact marker is present; real image/asset status stated in the change log. Human check NOT RUN.

### V2-P7 — `/display` cue (A-07; Announcements are praised, so cue only)
**D1 (recommended):** a bottom fade plus a count such as "▼ 5 weitere Mitteilungen" that disappears at the end of the list; cards untouched. D2 auto-paging (adds timing, needs a pause control, WCAG 2.2.2) and D3 a pager are deferred. Files: `BoardLayout.tsx` (+ `DisplayBoard.tsx`).
- **Acceptance:** with eight published notices at 1080×1920 the cue states the right count in DE and EN; it disappears at the end; empty state unchanged; `display-overflow.spec.ts` and `display-states.spec.ts` pass unchanged.

### V2-P8 — Accessibility cluster (A-13, A-14, A-15, A-19)
Per-route document language (a small client effect or documented acceptance), localized `/booking/cancel` title and consistent suffix, a skip link, placeholder colour ≥ 4.5:1, an H1 on `/display` (visually unchanged), accessible names that include the room code for the 54 repeated links, a distinct "Raum nicht gefunden" message for an unknown `raum`, language buttons ≥ 8 px apart, an active-tab cue that is not colour alone. Files: `layout.tsx`, `PublicShell.tsx`, `PublicNav.tsx`, `RoomDirectory.tsx`, `DaySchedule.tsx`, `booking/cancel/page.tsx`.
- **Acceptance:** assertions for `lang`, titles, placeholder contrast and unique link names run in DE and EN; no screen-reader claim without a screen-reader session.

### V2-P9 — Decisions (no code until decided)
- **Idle reset (A-06):** contract C7 says there is none. A shared kiosk may need one; if yes, behind a kiosk flag, with a visible warning before reset, and a duration chosen from observation (none is proposed here).
- **Typing (A-11):** after V2-P0/T35 find out whether the kiosk has a physical or system keyboard. If not, prefer quick-pick controls (floor chips, day buttons, room-by-floor picker, date as day buttons) over a custom on-screen keyboard; native `select`/`date` pop-ups are not captured by headless tests and must be looked at on the device.
- **Receipt time/code (HE-06):** decide after real sessions; do not change the API contract in V2 without a decision.

## 4. Cross-cutting acceptance and process

- Technical: `typecheck`, `lint` (currently 0 problems over 177 files), unit, build, `PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e`, `scripts/verify-restart.sh` on a temporary DB, run **after** each implementation batch, never against Ali's running manual server or `.next`. New behaviour gets new specs; existing specs are not weakened.
- Audit scripts stay as measurement tools; the geometry checks (target size, overlap, focus not obscured, dock position) should become permanent specs.
- Evidence per change: problem → finding ID → decision → files → before/after screenshots at the **same** viewport, language, data → technical result → human result or **NOT RUN**, recorded in `docs/hci/change-log.md`.
- Human and physical checks (not replaceable by this audit or by any simulation): T35 touch recovery, V2-P0 measurements, real taps and reach, the T22 outside-participant round.

## 5. Decisions Ali is asked to make

1. Approve the smallest first batch (P0, P1, P6, P5, P2) or reorder.
2. Fixed bottom dock (A) versus keeping the top nav plus a bottom Home bar (C); include `/display` in the dock or not.
3. Receipt-phase guard G1/G2/G3 and `type="text"` for the cancellation code (◆ items in P6).
4. Cue on `/display` (D1) — acceptable inside "preserve Announcements"?
5. Image: supply or approve a campus photo and an official logo vector, or stay with pictograms.
6. Idle reset yes/no; typing strategy after the keyboard question is answered.
7. V1 freeze: record the audited version (`a7903db`; the audited working tree had no runtime edits) as the comparison baseline before V2 changes start.

## 6. Course mapping (reasoning, not evidence of benefit)

| Concept (page) | Where it applies here |
| --- | --- |
| Fitts / motor control pp.49–50 | Dock size and position, map marker size and spacing, language switch gap |
| Attention and cognitive load pp.43–47 | Copy removal, Home with fewer repeated entries, slot grid |
| Mental models p.56 | Room code labels matching signage; IDs unchanged |
| Gulf of execution/evaluation p.59, errors pp.60–61 | Receipt guard, code input, distinct error messages |
| Feedback pp.65, 82 | Confirm in view, `/display` cue |
| Consistency pp.80–81 | One shell, one navigation position, language handling |
| Human-centred design p.106, walkthrough p.129, Nielsen p.130 | Method; heuristics mapped in `03-comparison-and-addendum.md` §4 |
