# Authoritative task board and execution checkpoints

Prepared by Codex on **31 October 2026**. **Execution started 31 October 2026 (Claude Code, branch `integrate/team-v1-20261031`).** Historical audit results are in the brief/audit, not task completion for this new integration run.

Use these states: `TODO`, `IN_PROGRESS`, `IMPLEMENTED` (code present, acceptance not yet verified), `VERIFIED`, `WAITING_HUMAN`, `BLOCKED` (name the concrete blocker), `DEFERRED` (give reason). Mark a task VERIFIED only within its stated acceptance scope. A partial human-dependent task can remain WAITING_HUMAN while its prepared files and technical results are listed in Evidence.

This table is the single authority for task state. Update plan step checkboxes and Persian vault summaries in the same checkpoint; if they disagree, inspect evidence and correct the summaries. Never count a prepared test or report as a completed study.

| ID | Priority | Depends on | Deliverable | Executor / external input | Status | Evidence / commit |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | P0 | — | Current state and start checkpoint | Claude | VERIFIED | Start `4ae9808` = origin/main; branch created; see checkpoint IMPORTED |
| T01 | P0 | T00 | Provenance and attribution ledger | Claude; joint split unknown | VERIFIED | `docs/contributions.md`; 67/67 source hashes identical; name-only authors accepted by Git (`bb00a2a`) |
| T02 | P0 | T00 | Safe integration branch + isolated DB | Claude | VERIFIED | Branch `integrate/team-v1-20261031`; `.demo-data/` ignored; seed refuses `data/` (`bb00a2a`, `7cae97f`) |
| T03 | P0 | T01,T02 | Original Aryan map import | Claude import / Aryan source | VERIFIED | `7326b8e` author `Aryan <>`; 47 unique entries 21/18/8; image hashes identical; app.js syntax ok |
| T04 | P0 | T03 | Joint booking/map delta import | Claude import / joint source | VERIFIED | `1c566f3` author `Aryan and Parsa (joint) <>`; 10/10 anchors; migration 4; typecheck 0; bookings unit 8/8 |
| T05 | P0 | T04 | Reza verbatim import + separate integration | Claude import / Reza source; Ali wiring | VERIFIED | `6bc0b21` Reza verbatim + `cb74062` Ali wiring; DE/EN render and links tested in `integrated-navigation.spec.ts` (T17 60/60) |
| T06 | P0 | T04,T05 | Working integration contracts | Claude / Ali's requested scope | VERIFIED | `fe8d7c3` contract C1–C9, all rows now with tested status; `integration-contracts.test.ts` 5/5 (`64d2801`) |
| T07 | P0 | T06 | Unified seed + stable geometry IDs | Claude | VERIFIED | `7cae97f`; map-config + team-demo unit 17/17; seed run twice on `.demo-data/team-demo.sqlite` (48 new, then 0 new) |
| T08 | P0 | T04,T06 | Pending request/receipt fix | Claude | VERIFIED | `fb55c6d`; `booking-pending.spec.ts` 4/4 failed before (null-ref reproduced), 4/4 pass after |
| T09 | P0 | T07,T08 | Explicit selection + request states | Claude | VERIFIED | `fb55c6d`; `booking-selection.spec.ts` 5/5 |
| T10 | P0 | T06,T07 | Atomic occupancy / API / eligibility | Claude | VERIFIED | `ead0cf0`; occupancy/booking units; worker-thread race 3/3 (fails without transaction); `booking-api.spec.ts` 2/2 |
| T11 | P0 | T07 | Live-ID map in shared shell | Claude adapting Aryan source | VERIFIED | `fac4a89`; `map-integration.spec.ts` 7/7 |
| T12 | P0 | T05,T11 | Shared navigation/query/language | Claude | VERIFIED | `fac4a89`; `integrated-navigation.spec.ts` 7/7 incl. simulated 540×960 and 1080×1920 |
| T13 | P0 | T08,T09,T10,T12 | Localized booking/receipt/cancel | Claude | VERIFIED | Reopened 2026-11-01 by the independent review (V1-R001, V1-R002); corrected in `9144cff`: review probes 2/2 failed before → pass after; 4 new regressions fail on the original runtime (sensitivity) → pass; full acceptance unit 136/136, E2E 66/66, restart PASS 13 (`docs/evidence/v1-corrections-2026-11-01/`). Human timing of the 60 s receipt: NOT RUN |
| T14 | P0 | T10 | Minimal Katja booking UI | Claude | VERIFIED | `5859bb4`; `admin-bookings.spec.ts` 2/2 |
| T15 | P0/P1 | T05,T12 | Working newcomer entry/content | Claude; Reza factual input in T21 | IMPLEMENTED | `5c5a3c9`; in-app links DE/EN tested; real newcomer facts pending T21 (Reza) |
| T16 | P0 | T08–T15 | Clean lint, regression and docs | Claude | VERIFIED | `64d2801`, `43bd5f2`; lint 0 problems; archive wording fixed (old journey passes); docs updated |
| T17 | P0 | T16 | Full acceptance + restart/races | Claude | VERIFIED | code `64d2801`: typecheck 0, lint 0, unit 134/134, build 0, E2E 60/60, concurrency 3/3, restart PASS 13 (attempt 1: script bug); `docs/evidence/integration-2026-10-31/T17/` |
| T18 | P1 | T00 | Research templates/change ledger | Claude; humans supply results | VERIFIED | `43bd5f2` docs/hci: proto-personas (hypotheses), change-log CH-001..011, test plan, templates, outlines; no study claimed |
| T19 | P0 | T17,T18 | Frozen/shareable integrated V1 | Claude | BLOCKED | V1 frozen locally: code `64d2801`, docs `43bd5f2` (`docs/hci/versions.md`); publishing the branch to GitHub was denied by the local agent permission policy — Ali to publish it |
| T20 | P1 | T00; T19 for app check | Real screen / second device | Reza/Ali; Claude prepares | TODO | — |
| T21 | P1 | T00 | Facts, provenance, Moodle dates | Reza/team; official sources | TODO | — |
| T22 | P1 | T18,T19 | Actual human task observations | Humans; Claude processes records | TODO | — |
| T23 | P1 | T18,T19; add human data when available | Ranked V2 decisions | Claude + actual evidence | IMPLEMENTED | `50bd120`: analytical HE-01..08, CW-01, ranked V2 candidates; human data not yet available |
| T24 | P1/P2 | T23 | Selected UI/UX V2 changes | Claude | DEFERRED | Sequenced after first T22 session so V1 stays the tested version (`docs/hci/v2-decisions.md`) |
| T25 | P1 | T24 | Current regression + human retest | Claude / actual participants | TODO | — |
| T26 | P1 | T18; latest real evidence | Attributed booklet draft/final | Claude draft / each member review | TODO | — |
| T27 | P1 | T19; latest V2 if ready | Short demo + rehearsal status | Claude prepares / presenter rehearses | TODO | — |
| T28 | P1 | T19; final completed code | Reviewable branch/docs/package | Claude | TODO | — |
| T29 | P1 | Current checkpoint | Follow-up packet and vault sync | Claude | IMPLEMENTED | `docs/hci/review-handoff.md`; vault HCI-05/06/16/19/00/02 updated 2026-10-31; correction checkpoint 2026-11-01 (HCI-00/03/05/06/16/19/20) |

## Checkpoints

### PLAN-PREPARED — 31 October 2026

- Work actually performed: read current instructions/source audit/contracts/design, re-extract and inspect course PDF/text references, prepare this handoff and Persian vault notes.
- Runtime implementation: **none in this planning turn**. No fresh application tests, commit, push or deployment claimed.
- Baseline technical evidence remains the earlier source audit; do not relabel it as a run on this future branch.
- Next: Claude performs T00 → T01/T02 → T03/T04/T05, then T06/T07 and bug fixes. T18 can be prepared during technical waits.

### PLAN-REVIEWED — 31 October 2026

- A read-only plan reviewer checked all four execution chunks and adjacent handoff documents. Initial findings: T05 ordering/source-versus-wiring attribution, and navigation during an unresolved booking potentially discarding credentials.
- Corrections: T05 depends on T04 and separates verbatim Reza source from Ali wiring; T04 likewise separates new adaptations. T08/T13 specify unresolved-request navigation protection, explicit warned abandonment, forced-unload limitations and a corresponding regression. Credential traces/video/screenshots, floor-query clearing and exact test commands were clarified.
- Follow-up review: **all four chunks Approved**, no remaining plan blockers. This is document review, not an assertion that the application is fixed or tested.
- All execution rows remain TODO. No runtime code changes, fresh application tests, commit or push were performed by the planning turn.

### IMPORTED — 31 October 2026 (Europe/Berlin, afternoon)

```text
Checkpoint: IMPORTED / 2026-10-31
Branch / HEAD / dirty paths: integrate/team-v1-20261031 / 7cae97f / untracked .claude/.headroom_wrap_settings.lock (excluded)
VERIFIED task IDs: T00, T01, T02, T03, T04, T07
IMPLEMENTED, not verified: T05 (DE/EN render check pending), T06 (contract tests pending with T10)
Current task and next step: T08 pending-request fix, then T09/T10
Checks actually run (command, exit, count, evidence):
  source re-hash vs audit manifest: 67/67 identical (docs/evidence/integration-2026-10-31/README.md)
  npm run typecheck after T04, T05, T07: exit 0 each (T04/T05/T07-typecheck.log)
  vitest tests/unit/bookings.test.ts after T04: 8/8 (count from that run's JSON report; log only has wrapper output)
  vitest map-config + team-demo + bookings after T07: 25/25 (T07-unit.log)
  seed CLI twice on .demo-data/team-demo.sqlite: 48 new then 0 new (T07-seed-demo-db.log)
Still failing / concrete blockers: known audit defects A-01..A-09 open by design until T08-T16; lint not yet run on branch
Human input pending (owner and exact request): Aryan+Parsa: internal split of joint package; Reza: newcomer facts (T21)
Contribution/import/adaptation commits: 7326b8e Aryan; 1c566f3 Aryan and Parsa (joint); 6bc0b21 Reza; Ali: 201a006, bb00a2a, cb74062, fe8d7c3, 7cae97f
HCI change IDs and evidence type: none yet (change-log created in T18)
Vault updated (notes) or pending outbox path: HCI-05, HCI-19, HCI-00 updated at this checkpoint
Next 1-3 executable IDs: T08, T09, T10
Scope intentionally deferred: none
```

### V1-READY (local) — 31 October 2026, evening (Europe/Berlin)

```text
Checkpoint: V1-READY (local; GitHub branch publication pending) / 2026-10-31
Branch / HEAD / dirty paths: integrate/team-v1-20261031 / 43bd5f2 (+ this board update) / .claude/.headroom_wrap_settings.lock (excluded)
VERIFIED task IDs: T00-T14, T16, T17, T18
IMPLEMENTED, not verified: T15 (in-app part tested; real facts pending T21)
BLOCKED: T19 publication only (agent permission policy denied the branch upload); local V1 is complete
Current task and next step: T29 vault sync, then T23 analytical review on integrated-v1
Checks actually run (command, exit, count, evidence) on code 64d2801:
  npm run typecheck exit 0 (also rerun after the last edits)
  npm run lint exit 0, 0 problems (first run 3 warnings, fixed)
  npm test exit 0, 134/134 in 17 files
  npm run build exit 0
  npm run test:e2e exit 0, 60/60 (SCREENSHOT_DIR=docs/evidence/integration-2026-10-31/screenshots)
  npx vitest run tests/unit/booking-concurrency.test.ts exit 0, 3/3
  bash scripts/verify-restart.sh: attempt 1 exit 1 (script ordering bug), attempt 2 exit 0, PASS 13
  credential pattern scan of T17 logs: 0 matches
Still failing / concrete blockers: GitHub branch publication (permission); no failing test suite
Human input pending: Aryan+Parsa joint split; Reza screen measurements (T20) and newcomer facts/help destination (T21); team: Moodle dates/format (T21); volunteers/Katja for U1-U6 (T22)
Contribution/import/adaptation commits: originals 7326b8e (Aryan), 1c566f3 (Aryan and Parsa joint), 6bc0b21 (Reza); Ali integration fe8d7c3, 7cae97f, ead0cf0, fb55c6d, fac4a89, 5e114cb, 5859bb4, 5c5a3c9, 64d2801, 43bd5f2
HCI change IDs and evidence type: CH-001..CH-011, technical/analytical; human result NOT RUN for all
Vault updated (notes) or pending outbox path: HCI-05, HCI-06, HCI-16, HCI-19, HCI-00, HCI-02 at this checkpoint
Next 1-3 executable IDs: T23 (analytical part), T24 (only analytically motivated, labelled), T28/T29
Scope intentionally deferred: V2 styling until T23; no deployment, no main merge
```

### Append after each meaningful checkpoint

Copy this shape, replacing fields only with actual facts:

```text
Checkpoint: <name> / <actual Europe-Berlin date>
Branch / HEAD / dirty paths:
VERIFIED task IDs:
IMPLEMENTED, not verified:
Current task and next step:
Checks actually run (command, exit, count, evidence):
Still failing / concrete blockers:
Human input pending (owner and exact request):
Contribution/import/adaptation commits:
HCI change IDs and evidence type:
Vault updated (notes) or pending outbox path:
Next 1–3 executable IDs:
Scope intentionally deferred:
```

Prefer a checkpoint after each finished task and a short update during longer work; do not stop working merely because a checkpoint was written. Do not repeatedly rerun already green checks without changes/new concerns. For a blocked task, retain its evidence and continue independent tasks.

## Useful execution milestones

| Milestone | Evidence required | What it does not establish |
| --- | --- | --- |
| IMPORTED | T01–T07, source/ID manifest, migration and smoke checks | Booking/map correctness or human success |
| CORE-CONNECTED | Critical T08–T15 behaviors verified | Full suite, restart/race or physical screen validity |
| V1-READY | T17/T19 actual green checks, commit and reproducible demo | Human study, final booklet, campus deployment |
| V2-IMPLEMENTED | Selected T23/T24 changes and rationale | Measured benefit without human retest |
| REVIEW-PACKET | T28/T29 current evidence and explicit gaps | Automatic main merge or examination submission |

### INDEPENDENT-REVIEW — 1 November 2026

- Reviewed local HEAD `c2933f6` (runtime equivalent to `64d2801`), 20 commits ahead of local main. No runtime edit, commit, push, merge or deployment in this review.
- Fresh isolated checks: typecheck and lint exit 0; unit 134/134 including 3 concurrency tests; production build exit 0; original E2E suite 60/60; restart PASS 13. Earlier attempts stopped before tests on font/build-process restrictions; logs retained.
- Two new browser probes fail on the unchanged app: **V1-R001** cancelled replay is presented as a saved booking; **V1-R002** settled receipt language switch retains the old room name. T13 is therefore reopened as IMPLEMENTED pending these corrections and revalidation. Historical VERIFIED checkpoints are not erased.
- Evidence and scoped Claude follow-up: `docs/reviews/2026-11-01-integrated-v1-review.md`, `docs/evidence/review-2026-11-01/`.
- Source inputs: 67/67 hashes unchanged; real `data/` files: all 3 checksums unchanged. No physical screen, second device or human study.
- Documentation follow-up: contribution adaptations after T07 and execution-plan step checkboxes need reconciliation with actual evidence (currently 0 checked / 171 unchecked). Do not blanket-check human-dependent steps.
- Next executable scope: fix V1-R001 and V1-R002, reverify T13 and record a technical revision; then first human round, selected V2 and booklet/demo work. Remote publication status was not checked here.

### V1-CORRECTED (local technical revision) — 1 November 2026, night (Europe/Berlin)

Appended; the INDEPENDENT-REVIEW entry above and the original findings stay unchanged.

```text
Checkpoint: V1-CORRECTED (local; technical revision of integrated V1, not V2) / 2026-11-01
Branch / HEAD / dirty paths: integrate/team-v1-20261031 / see final report (83efaac review docs, 9144cff fix, then documentation commit) / .claude/.headroom_wrap_settings.lock (excluded)
VERIFIED task IDs: T00-T14, T16-T18 (T13 re-verified after V1-R001/V1-R002)
IMPLEMENTED, not verified: T15 (real facts pending T21), T23 (analytical only), T29
Resolution: V1-R001 cancelled replay now shown as "Diese Reservierung ist storniert / This booking is cancelled" (no code, no re-creation, unknown state stays retryable); V1-R002 receipt keeps source names and localizes at render (DE/EN switch, fallback marker, no resend, countdown not reset)
Checks actually run on the correction (exit, count; evidence docs/evidence/v1-corrections-2026-11-01/):
  review probes before fix: exit 1, 2/2 failed at the intended assertions
  new regressions on original runtime: exit 1, 4/4 failed (sensitivity; 6 dumped test-DB codes redacted, assertions narrowed)
  targeted after fix: exit 0, 13/13
  npm run typecheck 0; npm run lint 0 (0 problems); npm test 0, 136/136 in 18 files; concurrency 3/3; npm run build 0
  PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e 0, 66/66; bash scripts/verify-restart.sh 0, PASS 13
  real data/ checksums: unchanged (3 files)
Still failing / concrete blockers: none in the suite; GitHub publication still Ali's action (T19)
Documentation: contributions §5 extended to T08-T23 + corrections; execution-plan checkboxes reconciled (125 checked / 46 open with notes); change log CH-012/CH-013; versions `v1-corrected`; clean demo screenshots (14, simulated portrait) from a fresh seeded demo DB
Human input pending: unchanged — Aryan+Parsa split; Reza T20/T21; team Moodle dates; participants/Katja for U1-U6
HCI change IDs and evidence type: CH-012 (feedback / Gulf of Evaluation), CH-013 (consistency / localization): technical; human result NOT RUN
Next 1-3 executable IDs: T22 first human round on this corrected V1; then T24 (CW-01 first); T19 publication by Ali
Scope intentionally deferred: V2 design work, schedule booking link (CW-01), push/merge/deploy
```

