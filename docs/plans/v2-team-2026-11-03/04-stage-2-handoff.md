# Stage 2 handoff — Home, Newcomers and Rooms (AL-03, AL-04)

Prepared 4 November 2026 by Claude Code for Ali. Local documentation only; no message was sent. Contract: [`docs/contracts.md` C11](../../contracts.md); evidence: [`docs/evidence/v2-ali-stage-2-2026-11-04/`](../../evidence/v2-ali-stage-2-2026-11-04/README.md). Nominal browser emulation, not the physical screen, not a human result.

## For Reza
- `src/lib/newcomers/content.ts` was **not edited**. The page renders his titles, bodies and button labels verbatim, in his order (the test compares them one by one), with a pictogram per card. The only new strings are the compact "Prototyp · Beispieldaten – …" line (replacing the long coloured block, in `newcomers/page.tsx`), the Rooms scope sentence and the floor-chip labels. The old sentence "check important details with official sources" went with the block: decide whether it belongs in his copy.
- Packet in the §6 format: [`reza-packet.md`](../../evidence/v2-ali-stage-2-2026-11-04/reza-packet.md). No campus fact, contact, opening time or office location was added or guessed; T33/T34 (offices, kitchen label) stay open.

## For Aryan (`CampusMap.tsx`, not edited)
- Floor chips on `/rooms` do not touch the map. Room links keep `?raum=<id>` and, from class results, `&datum=`.
- **Pre-existing flaky test:** `map-integration.spec.ts` › "markers sit on the image at their normalized position, also after zooming" failed in 1 of 3 isolated runs on the **Stage 1 build** and in 1 of 3 on the Stage 2 build, with the identical deviation (0.0834 against a 0.01 limit). It measures a marker box right after zooming without waiting for the layout to settle. Not caused by Stage 2; not edited. Worth a stable wait in AP-01.

## For Parsa (booking, DaySchedule, cancel; not edited)
- The room cards' booking link is unchanged (`/booking?raum=<id>`), now in the same row as the other two actions. Nothing in the booking flow, receipt, guard or schedule changed.
- The Stage 1 open item stays: the confirm button sits far below the fold at kiosk size (AP-03).

## Limits and what Stage 2 did not do
Skip link, document language, `/display` heading (Stage 3); the optional "more notices" cue; any map/booking/content change; hardware diagnosis; commit or push.
