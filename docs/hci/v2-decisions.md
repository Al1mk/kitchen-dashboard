# V2 decisions (T23) — initial analytical review and later field-review inputs

**Current work allocation, 3 November 2026:** Ali asked to combine the completed Claude audit/proposal with his field feedback and distribute the work across four members, keeping Reza's coding lighter so he can edit documentation and present. [Assigned plan](../plans/v2-team-2026-11-03/01-team-tasks-fa.md): Ali shared UI/Rooms/integration; Aryan+Parsa joint map/booking and PowerPoint; Reza newcomer copy, records, editorial work and presentation. Every member supplies their own evidence and personal booklet text. T24 is now TODO, not implemented. Optional/behavioural decisions are marked in the plan; this allocation does not silently approve every proposed API/timeout/idle change. The historical decisions below are preserved.

Inputs: `heuristic-evaluation.md` (HE-01…HE-08) and `cognitive-walkthrough.md` (CW-01) on `integrated-v1` (`64d2801`). Evaluator: Claude Code (AI) on Ali's behalf. **No participant data exists yet**; every item below is an analytical hypothesis, not a measured problem.

## Decision on timing

V1 stays frozen for the first human round (T22): changing the UI now would mean the people test a different version than the one documented. V2 implementation (T24) therefore waits for at least one real session, unless Ali decides otherwise. This is a sequencing choice, not a blocker on technical work.

## Ranked candidates (wrong outcome/blocker > confusion > friction > cosmetic)

| Rank | ID | Problem (analytical) | Proposed change | Alternative | Expected benefit (hypothesis) | Accept / retest |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CW-01 | Schedule of a room has no way to book it; user must go back | Add "Diesen Raum reservieren" to the schedule room header when reservable (keeps `raum`, `datum`, `lang`) | Rely on map/room list | Shorter path for U3 | E2E link test; U3 observation |
| 2 | HE-06 | Receipt may disappear before the code is noted | Decide after U3/U4: longer default, or shorter human-readable code (would change the API contract) | Keep 60 s + More time | Fewer lost codes | Count codes noted successfully in U3/U4 |
| 3 | HE-03 | Small, overlapping map markers at narrow width | Larger markers when zoomed; list filtered to search result first | Keep list as fallback | Fewer mis-taps | Real-screen measurement (T20), U2 |
| 4 | HE-01 | Two stacked demo notices push the booking form down | Merge into one notice | — | Less reading before the task | Screenshot; U3 |
| 5 | HE-02 / HE-05 | Repeated nav + tiles; long time list | Revisit with real screen size; group times by hour | — | Lower scanning load | U1/U3 |

Deferred / not proposed: new colour palette (no usability evidence), animation, accounts, any feature beyond the listed problems. HE-07 accepted as a documented prototype limitation. HE-08 depends on Reza's facts (T21).

## Ali's physical-display review received — 2 November 2026

The section above preserves the **31 October analytical baseline**. There is now additional input: Ali reports reviewing the physical ELO panel and supplies display settings/device photographs. This is team-member field feedback, not the outside-participant T22 study. [Full request and acceptance checklist](requests/2026-11-02-physical-kiosk-review.md); [evidence FR-01–FR-04](../evidence/field-review-2026-11-02/README.md).

Priority order for the proposed next round:

1. **T35 / P0:** diagnose reported missing touch; no cause or recovery established yet.
2. **T36 / P0:** lower reachable public navigation, larger targets, seven entries in a 4 + centred 3 layout on the portrait kiosk. Actual reach measurements remain open.
3. **T37–T41 / P1:** reduce small/repetitive public copy; enlarge Home/newcomer cards and add appropriate imagery; remove the large newcomer prototype block; adjust Rooms placement; trim Booking prose while preserving its behaviour.
4. **T42 / P1:** matched before/after captures, regressions and physical/user retesting. Preserve the positively reviewed Schedule and Announcements and keep the admin outside this layout scope.

**All UI changes remain TODO.** Ali asked to record them for later; T24's deferred implementation state has not changed. Earlier “no participant data” statements concern formal study evidence; they do not mean Ali's new report should be discarded. No measured UX improvement, physical touch success or finished V2 is claimed.

## V2 begins with Claude's exploratory audit — 3 November 2026

Ali now wants to start the V2 phase through actual Playwright exploration and sequential relevant UI/UX skills, before asking Claude to implement the team's proposed fixes. [Audit handoff T43](v2-audit-2026-11-03/README.md) is prepared, **not executed**. The original V1 code and technical evidence remain intact; the review above is preserved as history.

Phase A records browser observations before an explicit comparison with the existing feedback; exposure through mandatory project notes or chat must be disclosed, so this cannot automatically be called blinded. Phase B compares findings/misses and proposes layouts/tasks/acceptance checks. The audit stops before product changes. Ali reviews that direction before the implementation round; no new V2 code, hardware success, participant study or measured improvement is claimed.

## Audit executed — 3 November 2026

The audit prepared above was **executed**: [findings, comparison and V2 proposal](v2-audit-2026-11-03/README.md). It was a context-aware (not blinded) exploratory pass in nominal emulation; it does not overturn the 31 October ranking but adds receipt-phase, map-marker, confirm-step and `/display`-cue items, documents which recorded behaviours are deliberate (contract C7) and corrects one fact (HE-06 states a 22-character booking ID; the audit measured a 36-character UUID-shaped ID). All proposals remain **not implemented**; the choices needed from Ali are in `v2-audit-2026-11-03/04-v2-proposal.md` §5. Physical touch, reach, real viewport and every human result are still open.

## Stage 1 implemented — 3 November 2026

Ali's chosen direction for the shared shell (bottom dock, seven destinations 4 + centred 3, language switch lowered, larger kiosk text and column) is **implemented as V2-P1 Alternative A plus the scale part of V2-P2** (uncommitted, technical checks only): see [evidence](../evidence/v2-ali-stage-1-2026-11-03/README.md) and contract C10. Decisions taken inside that direction: kiosk mode by viewport/orientation (portrait, ≥ 520 CSS px), not pointer type, and no explicit override; scale by raising the root size for public pages only (not CSS `zoom`); the dock first in DOM order (skip link deferred to Stage 3); the board gets the same dock inside its frame (no AL-07 cue). Not decided and not done: receipt guard, cancel-code field, map markers, Home/Newcomers/Rooms, the optional board cue. All sizes stay provisional until V2-P0 measures the real panel; no benefit is claimed.

## Stage 2 implemented — 4 November 2026

V2-P3 H1 (Home as a 2 × 3 card grid with pictograms), the Newcomers layout and V2-P4 R3 + R1 (floor chips, compact room actions) plus the classes-first result order are **implemented** (uncommitted, technical checks only): [evidence](../evidence/v2-ali-stage-2-2026-11-04/README.md), contract C11. Decisions inside that direction: own inline SVG pictograms (no icon dependency, no invented photo, H2 hero stays blocked); chips pinned only in kiosk mode; actions in one row from 520 px; text size never reduced to save length; no office/staff mapping and no multi-day search. Still not decided or done: receipt guard, cancel code, map markers, booking copy, skip link/document language (Stage 3). No benefit is claimed.

## Parsa module integrated and reviewed — 4 November 2026

V2-P6/P8 delivered changes are now implemented with Ali’s review fixes: C12 and [combined evidence](../evidence/v2-integration-2026-11-04/README.md). Receipt acknowledgement, best-effort leave protection, stable warning/action area, cancellation hints/metadata, schedule booking CTA and meaningful404 feedback; existing lifetime/token/API rules retained. The previous Stage1/2 paragraphs describe their historical boundary; those pending receipt items are superseded by this integration. No human benefit established; Stage3 and map/content work remain open.

## Aryan AP01 repaired and integrated — 4 November 2026

AP01 follows HE-03/A-01 with grouped selection rather than shifting room positions. The original patch passed its own tests but failed measured kiosk hit geometry and keyboard/English regressions. The integration now measures the actual rem-scaled controls, preserves focus through chooser closure/selection/live regrouping and labels German fallback names. C13 and [evidence](../evidence/aryan-ap01-fix-2026-11-04/README.md) describe the exact technical scope. This is a justified technical/design correction, **not a measured human usability improvement**. Stage3, real-screen testing and human retesting remain open.

## Stage 3 implemented — 5 November 2026

The shared part of V2-P8 (accessibility cluster, AL-05) is **implemented and independently checked technically** on top of the integrated branch: [evidence](../evidence/v2-ali-stage-3-2026-11-04/README.md), contract C14. Decisions inside that direction: `<html lang>` follows the page through a small client leaf after hydration, because the installed Next.js 16.4.3 documentation offers per-request `lang` only through a `[lang]` path segment, which would rewrite every public URL (accepted limit: the server HTML of an English page still says `de` until hydration); the skip link is handled in the page (no hash, no history entry, no leave dialog) and is the first tab stop, which settles the "dock first in DOM order" note of Stage 1; room links keep their visible label and gain a visually hidden room code instead of an `aria-label`, so the accessible name still starts with what is written; placeholders use the existing muted ink at full opacity instead of a new token; `/display` gets an `h1` and `h2` cards without any visual change. Ali's completion fix also aligns the cancellation title suffix, with strict DE/EN regression checks. Final isolated checks: 187 unit, 180 E2E and 13 restart checks pass; read-only review found no actionable runtime regression. **Not decided or not done:** the optional "more notices" cue (AL-07), idle reset, any Stage3 screen-reader, on-device keyboard or human check. No claim of conformance with a standard is made. Booklet work was explicitly deferred by Ali and is outside this code delivery.
