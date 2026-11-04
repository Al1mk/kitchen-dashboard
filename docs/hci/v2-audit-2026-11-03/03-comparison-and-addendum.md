# V2 audit — comparison with the team's recorded feedback, and addendum

Written **after** the Phase A report was frozen (`02-phase-a-findings-FROZEN.md`, SHA-256 `5590f8ffae4c713cbcb787e1206090863972afd6b0ce7cbd9f986634b8e2517c`, 3 Nov 2026 17:30:17 CET). The frozen file is unchanged; everything learned afterwards is here and is labelled as such. This is a context-aware independent exploratory pass, **not a blinded study** (disclosure in section 1 of the frozen report).

Documents read for this comparison: `docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/hci/research/screen-specs.md`, `docs/evidence/field-review-2026-11-02/README.md`, the progress board rows T35–T43, `docs/hci/v2-decisions.md`, `change-log.md`, `versions.md`, `heuristic-evaluation.md`, `cognitive-walkthrough.md`, contract C7, `tests/e2e/display-overflow.spec.ts`, vault `HCI-00`, `HCI-05` (tail), `HCI-18`, `HCI-25`.

## 1. Comparison matrix

Categories: **F** found before explicit comparison; **P** partly found; **C** already known from context/mandatory notes; **M** missed in Phase A (seen or not seen; named after comparison); **N** not browser-verifiable; **X** not reproduced; **O** outside this audit's scope.

| # | Recorded feedback (source) | Phase A status | Notes |
| --- | --- | --- | --- |
| 1 | Touch does not work through the USB-to-USB-C adapter (FR-01, T35) | **N, C** | Supplied hardware report. **Not rediscovered.** The Elo screen was not attached to the audit Mac; no hardware diagnosis possible |
| 2 | Top controls hard to reach for shorter people (FR-01, T36) | **N**, framing **M** | Reach is physical. Phase A measured that every primary control sits in the top 245 px (13 %) of the 1920 px screen but did **not** frame it as a reach finding. A-09 only noted the header's size |
| 3 | Seven destinations as 4 buttons + 3 centred (T36) | **P** | Phase A saw the left-aligned 4+3 grid with an empty slot (A-09). Centring is Ali's request, not something I raised |
| 4 | Small text, repetitive explanations; the English paragraph "Course titles, lecturers…" (T37) | **P** | A-08 (14–18 px text, 728 px column) and A-17 (the notice on English booking pages). I did not rate 14–16 px helper text as a problem in its own right |
| 5 | Home: bigger cards, pictograms/imagery, visual focus lower (T38) | **P** | A-08/A-09: 728 px column, lower 45 % empty, 13 entry points to 6 destinations. Imagery was not proposed in Phase A |
| 6 | Newcomers: remove the large purple prototype block; enlarge four cards; keep the help card (T39) | **P / M** | A-16 (content gap, honest help card). The purple block is visible in my newcomer screenshot and I **did not report it**; I regarded the disclosure itself as honest. Different judgement from Ali (preference, see §5) |
| 7 | Rooms: placement, preserve search; the one-day scope confusion about "Chris" (T40) | **P** | A-02 (length), A-12 (negative message above the useful result). The day-scope hint was not named as a finding |
| 8 | Booking: remove repeated prose, keep the flow (T41) | **F** | A-17, and A-09 (two stacked banners). Flow behaviour confirmed good (conflict, retry, pending guard, double tap) |
| 9 | Schedule accepted; Announcements praised (T41) | consistent | Schedule showed no problem. A-07 touches Announcements: see §5 |
| 10 | Visual quality poor (FR-01) | **N** | Cause undiagnosed. Data point only: the logo is a 445×118 screenshot crop shown at 176 px (2.53× oversampled) and 367 px on `/display` (1.21×); at a device pixel ratio of 2 the display logo would be upscaled about 1.65×. Actual DPR unknown |
| 11 | Before/after capture on the real panel (T42) | **O** | Phase A screenshots are nominal emulation and **cannot** serve as the "before" for T42 |
| 12 | HE-01 two stacked demo notices on booking | **F** | A-09 |
| 13 | HE-02 nav and tiles repeat, lower half empty | **F** | A-08, A-09 (found independently of the doc, but the same architecture was in my context) |
| 14 | HE-03 map markers small and overlapping | **F, C** | A-01. The size (≈20–24 px) was stated in `DESIGN.md`, which I read before freezing; the overlap pairs and the hidden K1-115 are new measurements |
| 15 | HE-04 native date shows US format | **F** | A-11. Browser/OS dependent; unverified for the real kiosk |
| 16 | HE-05 up to 48 start-time buttons | **M** | I saw 31 buttons and judged the grid acceptable; no finding. Not re-assessed |
| 17 | HE-06 60 s receipt may be too short for the credentials | **P** | A-03, A-04, A-18. I did **not** assess whether 60 s suffices (no timing data). **Document discrepancy:** HE-06 says "22-character ID"; measured shape is 36 characters (UUID, `randomUUID()` in `bookings/repository.ts`) and a 43-character code |
| 18 | HE-07 leaving is guarded only while pending | **F, C** | A-03. Contract C7 documents that the guard is active only while the request is in flight or unknown. The *consequence* (one stray tap on a nav tile after the receipt loses the cancel code) was not recorded as a finding |
| 19 | HE-08 help card has no verified contact | **F** | A-16 |
| 20 | CW-01 room schedule has no booking link | **M** | Browser-verified after comparison (`09-addendum-checks.mjs`): `/schedule?raum=…` offers `← Vortag`, `Heute`, `Folgetag →`, `Auf der Karte`, `Alle Räume` and no booking link |
| 21 | V2 rank 2: decide receipt time or code after U3/U4 | open | Remains a human-test decision |
| 22 | SEARCH-R001 stays fixed | consistent | Back and Forward with search/day worked in the audit paths I ran; not a regression test |

### Found by Phase A and not in the recorded feedback

| ID | What | Status after source check |
| --- | --- | --- |
| A-02 (part) | 54 cards, three stacked buttons each, 8.6 screens, no jump aid | The length is new; "long list" appears only for the map list in HE-03 |
| A-04 | Hand-typing 79 characters; masked field (see §3) | HE-06 touches the code length, not typing or masking |
| A-05 | Confirm button below the fold, no scroll or focus move | Source: `BookingFlow.tsx` has no `scrollIntoView`/`focus()` call |
| A-07 | `/display` has no "more below" cue and no rotation | Scrolling itself is deliberate and tested (R-001, `display-overflow.spec.ts`: no clipping, last card reachable) |
| A-10 | Red has three jobs | Preference |
| A-12 | Search result order and no typo tolerance | New |
| A-13 | Accessibility cluster | `DESIGN.md` listed contrast as "to be audited in V2"; the rest is new |
| A-14, A-15, A-17 (part) | Invalid room URL shown as outage; logo not a link; irrelevant EN notice | New, low severity |
| A-19 (addendum, §2) | Language switch buttons 4.2 px apart | New, measured in Phase A data but not written up |

## 2. Addendum — new findings and corrections (after the freeze)

**A-19 Language switch spacing (severity 1).** On every page the `Deutsch`/`English` buttons are 87×48 and 80×48 px with a 4.2 px gap (the group is a rounded 4 px-padded pill). That is below the 8 px touch-spacing rule used in `ui-ux-pro-max`; with the switch at the top right it is also among the hardest controls to reach. The Phase A data already showed `gap < 8` for these two buttons on every page; it was not turned into a finding. The schedule's day buttons are 7.7 px apart (within rounding of 8 px).

**A-20 Schedule of one room has no booking link (CW-01, severity 2, observed).** See matrix row 20. It also applies in English.

Corrections and nuances to the frozen report (the frozen file is not edited):

| Frozen item | Correction |
| --- | --- |
| A-01 | 52.7×24 px **meets WCAG 2.2 SC 2.5.8 (24×24 minimum)**, so it is not an accessibility-standard failure; it fails the kiosk aim of 44–64 px used everywhere else in the UI. Severity 3 rests on the kiosk context and Fitts' Law, not on WCAG |
| A-03, A-06, A-18 | These are **documented design choices** (contract C7: expiry returns to Start; "no general kiosk idle reset"; the guard covers only a pending/unknown request). The audit adds user-consequence evidence, not a contradiction of the contract. A-06 and A-18 should be read as "decision to confirm", A-03 as "consequence to weigh" |
| A-07 | The inner scrolling list is the tested R-001 correction. The open point is **discoverability and unattended use** only |
| A-13.1 | `<html lang="de">` is static, but `PublicShell` wraps the content in `<div lang="en">` on English routes (checked: `html=de, wrapper=en`). Assistive technology uses the nearest `lang`, so the practical impact is lower than written; the title, browser translation prompts and document-level metadata remain German |
| A-08 | `max-w-3xl` in `PublicShell` (768 px; 728 px after padding) is the source of the narrow column. Confirmed |
| Phase A positive list | "Every non-map target at least 44 px": the language switch is 48 px high, tabs 56 px |

## 3. Source-confirmed causes (inspected only after the freeze)

| Finding | Source evidence | Cause status |
| --- | --- | --- |
| A-01 | `CampusMap.tsx:297`: marker is `absolute`, centred at a percentage position, with fixed `px-1.5 py-0.5 text-xs`; it does not scale with the plan | **Confirmed** (and listed as a known exception in `DESIGN.md`) |
| A-03 | `BookingFlow.tsx:110`: `locked = submitting \|\| uncertain`; `useLeaveGuard(locked)`; the receipt phase is not locked; `BookingReceipt` calls `onDone` at expiry and `finish()` navigates to Start | **Confirmed** |
| A-04 | `BookingCancel.tsx:66`: the code input is `type="password"` (masked while typed), `autoComplete="off"`; the ID input has `spellCheck={false}` but neither field has `inputMode` | **Confirmed** (new, found only by source) |
| A-05 | No `scrollIntoView`, `focus()` or `scrollTo` in `BookingFlow.tsx` | **Confirmed** |
| A-06 / A-18 | `BookingReceipt.tsx`: `RECEIPT_SECONDS = 60`, `setInterval`, `onDone`; contract C7 states there is no general idle reset | **Confirmed**, documented |
| A-07 | `BoardLayout.tsx:114`: `overflow-y-auto` list container; no "more" cue exists in the DOM at runtime | **Confirmed** |
| A-08 | `PublicShell.tsx`: `max-w-3xl` for header, nav and main | **Confirmed** |
| A-13.1 / 13.2 | `layout.tsx:18` static `lang="de"`; `booking/cancel/page.tsx:6` static German title with "LCC Campus Board" | **Confirmed** |
| A-13.4 | No skip link in the shell | **Confirmed** (grep) |
| A-15 | `PublicShell.tsx:38`: logo `<img>` not inside a link | **Confirmed** |
| A-11 | `type="date"` in `BookingFlow.tsx:328` and `RoomDirectory.tsx:295`; native `<select>` for room and duration | **Confirmed in source**; rendering on the real kiosk is **not** verifiable |
| A-12 | Room results are rendered before class results in the component I wrote earlier in this conversation | **Confirmed** |
| A-13.3 placeholders | Colour is the ink colour at 50 % alpha (measured 3.11:1) | **Measured**, source not read |
| A-14 | `/schedule` passes the `raum` value as `roomId`; an unknown id returns 404 and the page shows the generic outage text | **Observed**; code not read |
| A-02, A-09, A-10 | Layout choices, not defects with a single line cause | **No single cause**; design decisions |
| Touch, reach, visual quality | – | **Unknown**; no source cause is claimed |

A practical consequence for design: in the nominal kiosk emulation `(pointer: coarse)`, `(any-pointer: coarse)` and `(hover: none)` are true **only because touch emulation is on**. With the same viewport and touch off (which is what a Mac with a non-working touch path would report) they are false (`08-media-features.mjs`). A kiosk layout therefore **must not depend on `pointer: coarse`**; use viewport size/orientation, or an explicit switch. What the real browser reports on the Elo screen is a one-minute measurement for T42.

## 4. Nielsen mapping of the findings (evaluator judgement)

| Finding | Heuristic (Nielsen p.130) | Course concepts (project mapping, not proof of benefit) |
| --- | --- | --- |
| A-01, A-19 | 7 flexibility/efficiency; 5 error prevention | Fitts / motor control pp.49–50 |
| A-02, A-08, A-09, A-17 | 8 aesthetic and minimalist design | Attention / cognitive load pp.43–47 |
| A-03, A-18 | 3 user control and freedom; 5 error prevention | Errors/recovery pp.60–61; feedback p.82 |
| A-04 | 5 error prevention; 9 error recovery | Gulf of execution p.59 |
| A-05, A-07 | 1 visibility of system status | Feedback p.82 |
| A-06 | 3 user control; 5 error prevention | – |
| A-10, A-13, A-15 | 4 consistency and standards | Consistency pp.80–81 |
| A-11 | 7 flexibility; 2 match with the real world | – |
| A-12, A-14 | 2 match with the real world; 9 error recovery | Mental models p.56 |
| A-16, A-20 | 10 help and documentation; 6 recognition over recall | Walkthrough p.129 (CW-01) |

## 5. Where I disagree with, or want a decision on, a recorded choice

| Recorded choice | My position |
| --- | --- |
| Announcements are praised and must be preserved (T41) | A-07 does **not** ask to redesign the cards. I propose a cue only and want Ali's agreement before touching `BoardLayout.tsx` |
| Booking is good; keep receipt, countdown, More time (T41) | A-03 proposes an **additional** guard on the receipt. Behaviour change inside a module Ali called good: **needs Ali's decision** |
| Rooms generally accepted (T40) | A-02 (compact cards, jump aid) keeps structure, search and grouping. Whether 8.6 screens is a problem for real users is unmeasured; Ali decides |
| Remove the large purple block on Newcomers (T39) | I regarded the disclosure as honest and did not flag it, but I agree with removing it **if** a compact demo marker stays (T37 already says so). A preference, not a defect |
| Fixed bottom bar is one candidate (T36) | I recommend it, with the risks listed in `04-v2-proposal.md` (content obscured, focus, receipt, long pages) |
| 56 px is only a starting point (T36) | Agree: my measurements show 56 px everywhere except markers, but 56 px on a nominal screen says nothing about reach |
| No idle reset (contract C7) | Recorded design, not a defect. Whether a shared kiosk needs a reset is a decision (A-06) |

## 6. Honest limits of this comparison

The Phase A evaluator had read the project's design token note and had implemented parts of the app (disclosed), so "found before comparison" is not independent discovery of unknown problems. Findings rely on one browser engine and nominal sizes. The recorded feedback of Ali is a team-member report, not a participant study, and so are my findings: **neither is evidence of measured usability**, and no simulated check here counts as a human test.
