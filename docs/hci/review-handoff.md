# Review handoff — 2026-10-31 (for Ali / Codex review)

Branch `integrate/team-v1-20261031`, local only (GitHub publication was not permitted for the agent; Ali publishes it). V1 code `64d2801`; docs up to the latest commit on the branch. Authoritative task board: `docs/plans/team-integration-2026-10-31/02-progress.md`.

## States
- **VERIFIED:** T00–T14, T16, T17, T18.
- **IMPLEMENTED:** T15 (in-app part tested; facts pending), T23 (analytical part only).
- **BLOCKED:** T19 publication of the branch (permission) — local V1 complete.
- **DEFERRED:** T24 until the first human session (keeps V1 as the tested version).
- **WAITING_HUMAN / TODO:** T20 screen + second device (Reza/Ali), T21 facts/Moodle/joint split (Reza, team, Aryan+Parsa), T22 sessions U1–U6, T25 retest, T26 booklet review, T27 rehearsal, T28 final package after the above.

## Checks (code 64d2801, run 2026-10-31)
typecheck 0 · lint 0 problems · unit 134/134 · build 0 · E2E 60/60 · concurrency 3/3 · restart PASS 13 (first attempt failed on a script bug, fixed). Logs: `docs/evidence/integration-2026-10-31/T17/`. Not covered: physical kiosk, LAN second device, people, real campus accuracy.

## Contributions
Originals imported unchanged: `7326b8e` Aryan (map V12.2), `1c566f3` Aryan and Parsa joint (booking + map delta; internal split unknown), `6bc0b21` Reza (newcomers, drafts). Integration by Ali with Claude Code: see `docs/contributions.md` §5 and `docs/hci/change-log.md`.

## Review focus suggestions
1. `src/lib/occupancy/conflicts.ts` + repositories: every occupancy mutation inside `BEGIN IMMEDIATE`.
2. `src/components/public/BookingFlow.tsx` + `useLeaveGuard.ts`: snapshot/lock/uncertain-retry logic.
3. `src/components/public/CampusMap.tsx`: marker validity rules (`markerFor`).
4. Adapted imported tests in `tests/unit/bookings.test.ts` (marked comments) — contract change, not weakening.

## Human inputs needed (exact)
- Aryan + Parsa: who did which part of the joint package (or confirm "joint").
- Reza: screen model, size, resolution, orientation, browser, touch (T20 sheet in `docs/hci/research/screen-specs.md`); 3–5 real newcomer questions and one verified help destination with source (T21).
- Team: current Moodle dates and booklet/presentation format (slides show 2025).
- Volunteers / Katja or proxy: tasks U1–U6 (`docs/hci/testing/plan.md`).
