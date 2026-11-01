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
| T19 | P0 | T17,T18 | Frozen/shareable integrated V1 | Claude prepares; Ali publishes | VERIFIED | Ali pushed `integrate/team-v1-20261031` on 2026-11-01; remote = `f7f91af`, main unchanged `4ae9808`; fresh clone of the remote: typecheck 0, lint 0, unit 136/136, build 0, E2E 66/66, restart PASS 13 (`docs/evidence/post-push-verification-2026-11-01/`) |
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
| T30 | P1 | T19 | Full setup/admin/run/manual-test guide | Ali / Codex documentation | VERIFIED | 2026-11-01: README + `docs/run-guide.md`; scripts/configuration/Next CLI, local links/anchors and 11 shell-block syntax checks; documentation scope only, no additional accounts or fresh-reader result |
| T31 | P1 | T30 | Fresh-reader onboarding rehearsal | Ali coordinates / teammate | WAITING_HUMAN | Follow the guide from a fresh clone and record real results; no new-reader outcome yet |
| T32 | P1 | Existing rooms/API | Search bar on `/rooms` | Ali (with Claude Code); Aryan review of map/search links to agree | VERIFIED | 2026-11-01, uncommitted: shared matcher `src/lib/search/match.ts` (map uses the same rules), `/rooms` search with clear/no-results, floor grouping and ID links; unit `search-match.test.ts`, browser `room-search.spec.ts`; full suite typecheck 0, lint 0, unit 152/152, build 0, E2E 72/72, restart PASS 13. Evidence `docs/evidence/room-search-2026-11-01/`. Technical checks only, no human retest. Reopened by Codex review: SEARCH-R001 (same-page Back/navigation overwrites prior search/date); see `docs/reviews/2026-11-01-room-search-review.md`. Corrected and re-verified the same day: regressions failed before / pass after; full suite typecheck 0, lint 0, unit 152/152, build 0, E2E 75/75, restart PASS 13; evidence `docs/evidence/room-search-r001-fix-2026-11-01/`. Technical checks only |
| T33 | P1 | T32,T34; T21 for real sessions | Lecturer/staff/course → office or dated classroom | Ali coordinates; team reviews to agree | IN_PROGRESS | Classroom part IMPLEMENTED and technically tested 2026-11-01: course/lecturer search for a chosen day on `/rooms` (aliases Chris→Christian Zagel, MMI/HCI; broad names show all matches; cancelled, error and stale-day states); HCI demo lecturer = Prof. Dr. Christian Zagel. Office/staff part (Grosch, Katja, office-to-room mapping) still TODO and blocked on T34; demo sessions are not a real timetable (T21) |
| T34 | P1 | T21 / campus input | Verify office/person and kitchen labels | Reza/team with Ali/Aryan | WAITING_HUMAN | Grosch K1-105 recollection vs official K1-211; Katja/secretariat and communication/kitchen target pending confirmation; names/sources documented, no data edit |

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

### PUBLICATION-PREPARED (local, not pushed) — 1 November 2026, morning (Europe/Berlin)

- Codex's follow-up verification of the corrected V1 committed (`b1e89f2`).
- At Ali's instruction the 24 unpublished commits were given exactly `al1mk <alimk1752@gmail.com>` as author and committer; imports titled `Aryan part:`, `Aryan + Parsa part:`, `Reza part:`. Trees, order and timestamps unchanged (24/24 verified). All SHAs in the rows and checkpoints above are pre-publication; mapping: `docs/history-mapping-2026-11-01.md` (e.g. `64d2801` → `7588746`, `9144cff` → `27ef96b`).
- Backup: `Project/git-backups/campus-board-before-publication-20261101-104535/` (outside the repository).
- Checks on the unchanged runtime: typecheck 0, lint 0, unit 136/136. Evidence: `docs/evidence/publication-prep-2026-11-01/`.
- T19 publication: ready for Ali's manual push of `integrate/team-v1-20261031` only; remote verification and fresh-clone tests follow after his confirmation.

### PUBLISHED-AND-VERIFIED — 1 November 2026, late morning (Europe/Berlin)

- Ali pushed the branch himself. Read-only check: `integrate/team-v1-20261031` = `f7f91af7686c9966fa8d2a767fc03224cc3d4876` (the prepared HEAD), `main` = `4ae9808` unchanged.
- Fresh clone of the remote branch, `npm ci`, temporary databases, no `.env.local`/`data/` copied: typecheck 0, lint 0, unit 136/136, build 0, E2E 66/66, restart PASS 13. Evidence: `docs/evidence/post-push-verification-2026-11-01/`.
- The commit recording this is local only, for Ali's next push.
- Next: T22 first human round (U1–U6) on this published version; T20/T21 inputs from Reza and the team; then T24 starting with CW-01.

### RUN-GUIDE-PREPARED — 1 November 2026 (Europe/Berlin)

- Ali requested the full project run/account/test guide in README and the to-do list. T30/T31 were appended to the original plan; old step counts/checkpoints are historical, not renumbered.
- T30 VERIFIED for documentation: README quick start selects a disposable DB before either seed; the linked run guide separates initial account setup from restart, documents the one-admin limit, module walkthrough, credentials, LAN, backup, checks and port conflict recovery.
- Validation: current scripts/configuration and installed `next start --help` reviewed; local Markdown targets/anchors, 11 Bash blocks (`bash -n`) and documented npm script names checked; `git diff --check`. No app test suite, fresh clone onboarding, credential reset or data mutation performed for this documentation change.
- T31 WAITING_HUMAN: a teammate must actually follow the guide and report outcomes. Ali's current server start/manual results are still unconfirmed after the earlier known server was stopped to free port 3000.
- Documentation remains local for Ali to review/commit/push. No runtime code, credentials, database, teammate source, commit, push or deployment changed in this checkpoint. T20/T22 and the V2/booklet work remain open.

### SEARCH-REQUEST-RECORDED — 1 November 2026 (Europe/Berlin)

- Added T32 directory search and T33 people/course-to-room search as TODO; map room search is already present. T34 campus-content verification is WAITING_HUMAN. Requirements and primary-source conflicts are in `docs/hci/requests/2026-11-01-room-and-people-search.md`; README cards A-6/I-2/R-4 reflect the same states.
- Ali's tentative Grosch K1-105 recollection conflicts with the official campus-team K1-211 listing and supplied catalog EDV label. Katja/secretariat, adjacency and kitchen/communication target remain unverified; no record was changed. Office destinations must be distinguished from dated classroom results.
- Documentation checks: 35 local links/anchors, 11 Bash blocks and `git diff --check` without errors. Source/UI search presence inspected; official names/source listings read, not physically verified. No fresh app tests, implementation, staging, commit or push. Ali receives explicit instructions to stage the six related documentation files and exclude Headroom/local data.

### ROOM-SEARCH-M1 — 1 November 2026, afternoon (Europe/Berlin)

- Implemented T32 and the classroom part of T33 on `main` at `452d893` (working tree, **not committed**; Ali reviews and commits). Shared matching in `src/lib/search/match.ts`; `CampusMap.tsx` now imports it instead of its inline copy (same rules); `/rooms` has a labelled search field (code/DE/EN name; code variants `K1-105`, `K1 105`, `k1-105`, `105`), clear button, no-results message, floor grouping and the existing ID links. For a non-empty query it also shows classes of a chosen Berlin day (default today) whose course or lecturer matches, with time, lecturer, room, cancellation status and links to `/map?raum=&datum=` and `/schedule?datum=&raum=`. `?suche=` and `?datum=` keep the search across Back and the language switch.
- Approved aliases only: `Chris` → Christian Zagel; `MMI`/`HCI` → Mensch-Maschine-Interaktion (whole query, whole word). A punctuation-only query matches nothing. Schedule failures show the error state, not "no classes"; responses for a previous day are discarded.
- HCI demo lecturer set to **Prof. Dr. Christian Zagel** for the three HCI demo sessions in the two seeds (`HCI_LECTURER`); other placeholder lecturers unchanged; seed idempotency unchanged.
- Ali's manual demo DB `.demo-data/ali-manual-2026-11-01.sqlite`: SQLite online backup to `.demo-data/backups/ali-manual-2026-11-01.before-hci-lecturer-20261101-124915.sqlite` (integrity ok, rows equal), then one guarded one-off update of 3 untouched seed sessions (id pattern, demo flag, exact title, room, old placeholder, never edited); 0 skipped; dump diff shows only `instructor` and `updated_at` of those 3 rows. Verified through `/api/public/schedule` and the `/rooms` UI on a temporary port-3300 server, stopped afterwards.
- Checks (sequential, this checkout, temporary DBs): typecheck 0, lint 0, unit 152/152 (19 files), build 0, `PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e` 72/72, `verify-restart.sh` PASS 13; `data/` checksums and `.env.local` unchanged. Evidence: `docs/evidence/room-search-2026-11-01/`.
- Not done: office/staff search (Grosch, Katja), T34 label corrections, kitchen rename, any human usability retest.

### ROOM-SEARCH-INDEPENDENT-REVIEW — 1 November 2026 (Europe/Berlin)

- Fresh Codex unit run: 152/152, 19 files, exit 0. Existing Claude full-suite logs read, not rerun. Read-only demo/backup comparison confirms only the three intended HCI lecturer/update-time changes.
- New public browser probes against the current production build: 0/2 pass, one shared P2 finding SEARCH-R001. Back after language-switch edits and bare Rooms navigation retain/rewrite stale local search/date instead of accepting incoming URL state.
- T32 reopened to IMPLEMENTED pending correction/regressions; T33 stays IN_PROGRESS, T34 WAITING_HUMAN. Original successful-run records remain historical.
- Evidence/repro: `docs/reviews/2026-11-01-room-search-review.md`, `docs/evidence/room-search-review-2026-11-01/`. No runtime fix, manual/real DB mutation, staging, commit or push. Temporary probe server stopped.

### SEARCH-R001-CORRECTED — 1 November 2026, afternoon (Europe/Berlin)

- Codex's finding kept as recorded above. Cause: `/rooms` read `suche`/`datum` only on mount and its URL effect wrote older local state over incoming same-page navigations; the language links depended on that overwrite.
- Fix (uncommitted): one effect in `RoomDirectory.tsx` treats URLs it wrote itself (queued until echoed by `useSearchParams`) as echoes and every other incoming URL as navigation, which replaces the local query/day. New client `LiveLanguageSwitch.tsx` builds the DE/EN links from the current URL (no prefetch); `PublicShell` gets optional `liveParams`, `/rooms` passes `suche`, `datum`. No other page changed.
- Regressions in `room-search.spec.ts` (existing six unchanged): Back/Forward across language switch and edits; bare Rooms link in DE/EN; fast and ordinary typing without page loads. Before fix: Back test failed at the URL assertion, bare-link test failed by late rewrite. After: 9/9; three separate fresh-DB runs of the SEARCH-R001 tests 3/3 each; mutation removing the echo queue made the typing test fail.
- Full sequence: typecheck 0, lint 0, unit 152/152, build 0, E2E 75/75, restart PASS 13. Ali's demo DB, `data/` and `.env.local` unchanged (checksums); no DB update repeated. Evidence `docs/evidence/room-search-r001-fix-2026-11-01/`.
- T32 VERIFIED (technical scope). T33 stays IN_PROGRESS (office/staff lookup), T34 WAITING_HUMAN. Known test limitation: after a failure (or `--repeat-each`) the spec's `beforeAll` collides with its own fixed fixture slots (409).

### SEARCH-R001-INDEPENDENTLY-RESOLVED — 1 November 2026 (Europe/Berlin)

- Codex fresh unit 152/152 (19 files), independent public-browser probes 7/7, both exit 0. The two scenarios that failed before now pass; Forward/language/typing/clear also verified. T32 remains VERIFIED for technical scope; T33 IN_PROGRESS and T34 WAITING_HUMAN.
- Evidence: `docs/evidence/room-search-r001-recheck-2026-11-01/`; original finding unchanged, independent closure appended. Claude's full suite 75/13/build/lint/typecheck logs inspected, not rerun by Codex.
- Known fixture collisions on repeat/worker restart remain a test-harness follow-up, not a blocker to SEARCH-R001 closure. No runtime fix, valued data/credential edit, staging, commit or push here. Next: Ali manual walkthrough, then publication by Ali.
