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

## Update — 2026-11-01 (after the independent review)

- Review documents committed unchanged (`83efaac`). Findings V1-R001 (cancelled replay shown as saved) and V1-R002 (receipt language switch) fixed in `9144cff` as a **technical revision** (`v1-corrected` in `docs/hci/versions.md`), not V2. T13 is VERIFIED again.
- Checks on `9144cff`: review probes 2/2 failed before → pass; 4 new regressions fail on the original runtime → pass; typecheck 0 · lint 0 · unit 136/136 · concurrency 3/3 · build 0 · E2E 66/66 · restart PASS 13. Evidence: `docs/evidence/v1-corrections-2026-11-01/`.
- Documentation: contributions §5 through `9144cff`; execution-plan checkboxes reconciled (125 checked / 46 open, each open partial step annotated); CH-012/CH-013; clean demo screenshots without test fixtures.
- Review focus for this revision: `src/components/public/booking-result.ts` (which answers count as settled), `BookingReceipt.tsx` (cancelled state hides the code; names localized at render), the new tests in `booking-pending.spec.ts` and `booking-language-receipt.spec.ts`.
- Human inputs needed: unchanged (above). Publication of the branch remains Ali's action.

## Publication preparation — 2026-11-01

Before the first push, all 24 unpublished commits were given Ali's exact Git identity `al1mk <alimk1752@gmail.com>`; the three imports carry the subjects `Aryan part: …`, `Aryan + Parsa part: …`, `Reza part: …`. File trees, order and timestamps are unchanged (verified per commit). SHAs above are pre-publication; see `docs/history-mapping-2026-11-01.md` (e.g. `9144cff` → `27ef96b`, `64d2801` → `7588746`). Codex's follow-up verification is committed as `b1e89f2`. Prepared locally; Ali pushes the branch himself.
