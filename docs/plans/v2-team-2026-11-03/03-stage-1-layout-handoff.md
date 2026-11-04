# Stage 1 layout handoff — what Aryan, Parsa and Reza can now rely on

Prepared 3 November 2026 by Claude Code for Ali (Stage 1 of [`02-ali-claude-prompts.md`](02-ali-claude-prompts.md): AL-01 preparation and AL-02). **Local documentation only; no message was sent to anyone.** The contract itself is [`docs/contracts.md` C10](../../contracts.md); this note turns it into requests. Evidence: [`docs/evidence/v2-ali-stage-1-2026-11-03/`](../../evidence/v2-ali-stage-1-2026-11-03/README.md). Everything below was measured or tested in **nominal emulation in headless Chromium**; none of it is a physical-screen, reach or human result.

## What is now true for every module on a public page

- **Kiosk mode** = portrait and ≥ 520 CSS px wide (not pointer type). Use the Tailwind variant `kiosk:` for kiosk-only styling and `PUBLIC_KIOSK_MEDIA` (`src/lib/public-layout.ts`) in script. Do not use `pointer: coarse`.
- **One dock, bottom edge:** language switch above the 4+3 navigation, fixed, `[data-public-dock]`, ≈ 311 px high at 1080 px width (227 px at 540). Its real height is `--public-dock-h` on `<html>`.
- **Space is reserved for you:** the shell has bottom padding and the page has `scroll-padding-bottom` equal to the dock height (+ 1 rem). A last card, a form field, a receipt or a validation message therefore ends above the dock, and `focus()` / `scrollIntoView()` does not leave an element under it. You do not need to add padding of your own.
- **Rem sizes are bigger in kiosk mode:** the root is 22 px at 1080 px width (16 px up to 720 px), so every `rem`-based class grows 1.375× there (body 24.75 px, tile height 77 px, H1 49.5 px). If a hard physical minimum matters (a 44 px target), write it in `px`, not `rem`, and test at 1080 and 540 px.
- **Do not add a second fixed bottom bar.** If you must pin something at the bottom, offset it by `var(--public-dock-h)`.
- The leave guard still intercepts dock clicks (capture-phase `a[href]`), the dialog is in the top layer above the dock, and the language/query behaviour is unchanged.

## Requests per owner (dependency requests, not edits)

**Aryan — AP-01 `CampusMap.tsx` (I did not edit it).**
- The marker classes (`px-1.5 py-0.5 text-xs`) are rem-based, so in kiosk mode markers grew from 24 to 31.5 px high and text from 12 to 16.5 px. The 21 first-floor markers are **still under 44 px** (measured, `after/data/kiosk-touch-1080x1920/map-de.json`: 21 targets < 44 px before and after) and the K1-115/K1-118 overlap is still visible in `after/screens/kiosk-touch-1080x1920/map-de.png` (overlap not re-measured). Markers and plan image scaled together with the column, so I expect the ratio to be about unchanged; that is an inference, not a measurement.
- Re-measure all four floors at 1080 and 540 px width before choosing marker sizes; use `px` for the 44 px minimum. The map's own `max-h-[70vh] overflow-auto` plan box is a nested scroll region inside the page scroll; keep that in mind when the dock takes 16 % of the height.
- Reproduce with `audit-artifacts/v2-audit-2026-11-03/06-map-crop-overlap.mjs` (audit script, localhost copy only).

**Parsa — AP-02/03/04 booking, schedule, cancel (I did not edit them).**
- AP-03: the confirm step is now **further below the fold**: bottom edge 2938 px against 2271 px before at 1080×1920 (`measurements.md` §3), because the larger text lengthens the page. The dock does not cover it once it is scrolled or focused (tested: `confirm.focus()` leaves it above the dock), but nothing scrolls it into view yet. Calling `focus()` on it is tested to leave it above the dock (the page's `scroll-padding-bottom` does this). `scrollIntoView({ block: "nearest" })` should behave the same because CSS scroll-padding applies to it, but I did **not** test that call; check it in your AP-03 spec.
- AP-02: if the leave guard is extended to the receipt phase, dock clicks will be caught by the same capture-phase handler; The receipt "Fertig/Done" button ends above the dock (tested).
- A new spec pattern you can copy: `tests/e2e/kiosk-dock.spec.ts` ("the pending-booking guard still intercepts the dock; confirm and receipt actions stay above the dock").
- Not touched: `BookingFlow.tsx`, `BookingReceipt.tsx`, `BookingCancel.tsx`, `useLeaveGuard.ts`, `booking-copy.ts`, `DaySchedule.tsx`, `booking/cancel/page.tsx` (its German title is AP-03).

**Reza — R-01/R-02 evidence packet.**
- The Stage 1 packet in the §6 format is [`reza-packet.md`](../../evidence/v2-ali-stage-1-2026-11-03/reza-packet.md); screenshots are in the evidence folder (public, no credentials, no serial numbers).
- No text in `src/lib/newcomers/content.ts` was changed. The only copy decision in Stage 1 is where the shared English "Course titles …" note appears (schedule and rooms only).
- Physical measurements (V2-P0) are still needed from the real screen: `innerWidth × innerHeight`, `devicePixelRatio`, browser zoom, full-screen state, panel edge heights, comfortable reach band. Until they exist the dock height, tile size and the 520 px threshold remain provisional design choices.

## What Stage 1 deliberately did not do

Home/Newcomers layout and Rooms (Stage 2), skip link, document language, `/display` heading semantics (Stage 3), the optional `/display` "more notices" cue (AL-07), any booking, map or content change, any hardware diagnosis, commit or push.
