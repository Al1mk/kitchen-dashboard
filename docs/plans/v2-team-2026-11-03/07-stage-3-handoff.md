# Stage 3 handoff — shared accessibility and readiness (AL-05, AL-06 partial)

Prepared 4–5 November 2026 by Claude Code for Ali; completed and independently reviewed with Codex on 5 November. No message was sent. Contract: [`docs/contracts.md` C14](../../contracts.md); evidence: [`docs/evidence/v2-ali-stage-3-2026-11-04/`](../../evidence/v2-ali-stage-3-2026-11-04/README.md). Everything is a **browser-reported value in headless Chromium emulation**: not a screen-reader session, not a WCAG conformance audit, not the physical Elo screen, not a human result.

## What is now true on every public page

- **First Tab stop is a skip link** ("Zum Inhalt springen" / "Skip to main content") that moves focus to `<main id="main-content">` without a hash or history entry. It does not open the booking leave dialog while a request is pending. `/display` has none (no dock before its content; its first stop is the logo link).
- `<html lang>` follows the page language after hydration (`DocumentLang`); the wrapper `lang` was already right from the first byte. The server HTML of an English page still says `de` until hydration.
- **Top and bottom focus clearance:** `--public-dock-h` (C10) reserves the bottom; the pinned floor-chip bar of `/rooms` now publishes `--public-sticky-top`, used as `scroll-padding-top`. A module that adds its own sticky element must publish the same way.
- Room action links on `/rooms` and in class results end in a hidden ` – <room code>`, so 131 links with 3 distinct names became 131 distinct names. The visible label stays first.
- Placeholders are the muted ink at full opacity (6.39:1, was 3.11:1) on every shell page, including `/map`.
- `/display`: board title is the `h1`, announcement titles `h2`; pixels and sizes are unchanged. The admin preview is unchanged.
- The logo links to Home in the current language (public pages and `/display`).

## AL-06 — integration readiness: **PARTIAL, not "full V2 finished"**

| Item | State |
| --- | --- |
| Ali Stages 1–3 | integrated; Stage3 independently checked on a source-matched isolated copy: typecheck/lint/build pass, 187 unit, 180 E2E, 13 restart checks; separate read-only review found no actionable runtime regression |
| Parsa's V2 booking + Ali/Codex fixes R001–R006 | integrated and committed (`5f8dda9`, `a089f73`); the Stage 3 spec runs against them (180/180 together) |
| Aryan's AP01 map grouping + Ali/Codex repair | integrated and committed (`9b6eaba`, `39a7d8d`, `3d45bb7`); `CampusMap.tsx` was **not** edited in Stage 3 |
| Reza's final copy and facts | **not delivered**; `content.ts` unchanged, no fact invented |
| Contracts, task board, change ledger, run guide, Persian vault | updated for Stage 3 (see the evidence README) |
| Ali's booklet | **deferred by Ali; excluded from this code delivery** |
| Deck, rehearsal, other members' chapters, Moodle format/deadline | open; not Ali's to write |
| Elo touch (T35), reach, real viewport, native keyboard, screen reader, real users | **WAITING_HUMAN / NOT RUN** |

## Requests per owner (dependency requests, not edits)

**Parsa** (booking logic and `DaySchedule` unchanged; cancellation metadata aligned by Ali):
- Resolved during completion: `/booking/cancel` now ends in "Campus Board", like every public route. The Stage3 and existing cancellation tests require the exact suffix in DE/EN; neither suffix is optionally tolerated.
- In my captures no link name is ambiguous on `/schedule` or `/booking` in their default state (`measurements.md` §4). I did not explore every state (open receipt, many slots, error states); check repeated names there yourself.
- The skip link and your leave guard work together by design (`defaultPrevented`); keep that if you change `useLeaveGuard`.

**Aryan** (`CampusMap.tsx`; not edited): the map search placeholder is fixed globally by CSS (measured 6.39:1 on `/map`); nothing else changed. Marker and chooser behaviour (C13) were not touched or re-measured here.

**Reza:** the packet is [`reza-packet.md`](../../evidence/v2-ali-stage-3-2026-11-04/reza-packet.md). New visible/announced strings to review: the skip-link labels, the logo name suffix and the hidden room-code suffix. No campus fact or contact was added.

## What Ali can try by hand (no new tool needed)

1. Open `/?lang=en` in a window about 1080 px wide and tall, press **Tab once**: the skip link appears top left; **Enter** moves focus into the page, the address does not change. Press Tab again: the next stop is inside the page, not the dock.
2. On `/rooms`, scroll to the middle, click into the page, press **Shift+Tab** a few times: the focused link must never end up under the chip bar at the top or the dock at the bottom.
3. In the browser's developer tools check `<html lang>` on an English page after it has loaded.
4. Optional, **not done by me**: VoiceOver (Cmd+F5) and the link list on `/rooms`; the skip link should be the first link announced, before the logo link.

## What Stage 3 deliberately did not do

The original Stage3 implementation did not add the optional "more notices" cue (AL-07), map/booking logic, campus content, idle reset, token/timeout/receipt changes or hardware diagnosis. Final integration adds only the cancellation metadata correction. Existing test expectations were intentionally updated in `kiosk-dock.spec.ts` (announcement titles are `h2`), `stage2-layout.spec.ts` (action names include the room code) and `parsa-review-fixes.spec.ts` (exact common title suffix). The new Stage3 test also requires that exact suffix.

## Completion and next action — 5 November

Codex independently reproduced the two title failures, fixed the metadata, and ran all checks on an isolated copy. The first complete run then exposed two old title expectations (178 pass / 2 fail); after updating those expectations, all 180 passed, followed by all 13 restart checks. The runtime/test manifest equals the actual source (`8d715d5d320df408`, 199 files). The audit runner now reports positive-check failures through its exit status and refuses to overwrite a previous run; a focused probe verified both behaviours. Original capture labels disagree about the baseline commit, which is now disclosed in the evidence instead of claimed as exact provenance.

Prepare the code/evidence commit on `integrate/v2-ali-parsa-20261104` as `al1mk <alimk1752@gmail.com>`; Ali performs the push. No push, merge or deployment was performed in this completion pass. Do not stage the deferred Booklet files with `git add .`. Module owners still need to approve their content, and physical/screen-reader/human testing remains open.
