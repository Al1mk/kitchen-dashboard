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
| T20 | P1 | T00; T19 for app check | Real screen / second device | Ali device investigation; Reza records measurements | IN_PROGRESS | 2026-11-02: Ali's physical-display report, settings screenshot and device photo received; ELO ET4363L / E344056, selected portrait 1080×1920 at 60 Hz. Touch failure and reach concerns reported, not independently diagnosed. Heights/viewport/working touch/second-device checks remain open; `docs/evidence/field-review-2026-11-02/` Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T21 | P1 | T00 | Facts, provenance, Moodle dates | Reza verifies facts/Moodle; team supplies sources | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T22 | P1 | T18,T19 | Actual human task observations | Reza coordinates/records; module owners observe; real volunteers | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T23 | P1 | T18,T19; add human data when available | Ranked V2 decisions | Claude + actual evidence | IMPLEMENTED | `50bd120`: analytical HE-01..08, CW-01, ranked V2 candidates; human data not yet available |
| T24 | P1/P2 | T23; T43 audit for the next round | Selected UI/UX V2 changes | Ali shared UI/integration; Aryan+Parsa map/booking; Reza copy | IN_PROGRESS | **Stage 1 (AL-02) implemented 2026-11-03 and Stage 2 (AL-03/04) 2026-11-04, both uncommitted** (T36, T38, T40); Stage 3 and the Aryan/Parsa/Reza parts not started. Original sequencing after first T22 session preserved historically. On 2026-11-03 Ali starts V2 with an audit-first handoff (T43); this does not authorize runtime changes in the audit run. Implementation follows review of findings/design direction; no completed V2 or participant result yet (`docs/hci/v2-decisions.md`) Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update.  Earlier DEFERRED sequencing is superseded by Ali’s V2 task-allocation request; no runtime work performed. |
| T25 | P1 | T24 | Current regression + human retest | Module owners test; Ali final integration; Reza records | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T26 | P1 | T18; latest real evidence | Attributed booklet draft/final | Each member authors own section; Reza edits/assembles | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T27 | P1 | T19; latest V2 if ready | Short demo + rehearsal status | Aryan+Parsa build deck; Reza presents; Ali checks technical claims | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T28 | P1 | T19; final completed code | Reviewable branch/docs/package | Ali final integration/review; all owners supply evidence | TODO | — Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T29 | P1 | Current checkpoint | Follow-up packet and vault sync | Reza compiles records; each owner supplies actual results | IMPLEMENTED | `docs/hci/review-handoff.md`; vault HCI-05/06/16/19/00/02 updated 2026-10-31; correction checkpoint 2026-11-01 (HCI-00/03/05/06/16/19/20) Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T30 | P1 | T19 | Full setup/admin/run/manual-test guide | Ali / Codex documentation | VERIFIED | 2026-11-01: README + `docs/run-guide.md`; scripts/configuration/Next CLI, local links/anchors and 11 shell-block syntax checks; documentation scope only, no additional accounts or fresh-reader result |
| T31 | P1 | T30 | Fresh-reader onboarding rehearsal | Ali coordinates / teammate | WAITING_HUMAN | Follow the guide from a fresh clone and record real results; no new-reader outcome yet |
| T32 | P1 | Existing rooms/API | Search bar on `/rooms` | Ali (with Claude Code); Aryan review of map/search links to agree | VERIFIED | 2026-11-01, uncommitted: shared matcher `src/lib/search/match.ts` (map uses the same rules), `/rooms` search with clear/no-results, floor grouping and ID links; unit `search-match.test.ts`, browser `room-search.spec.ts`; full suite typecheck 0, lint 0, unit 152/152, build 0, E2E 72/72, restart PASS 13. Evidence `docs/evidence/room-search-2026-11-01/`. Technical checks only, no human retest. Reopened by Codex review: SEARCH-R001 (same-page Back/navigation overwrites prior search/date); see `docs/reviews/2026-11-01-room-search-review.md`. Corrected and re-verified the same day: regressions failed before / pass after; full suite typecheck 0, lint 0, unit 152/152, build 0, E2E 75/75, restart PASS 13; evidence `docs/evidence/room-search-r001-fix-2026-11-01/`. Technical checks only |
| T33 | P1 | T32,T34; T21 for real sessions | Lecturer/staff/course → office or dated classroom | Ali integration; Reza verifies office facts; team reviews | IN_PROGRESS | Classroom part IMPLEMENTED and technically tested 2026-11-01: course/lecturer search for a chosen day on `/rooms` (aliases Chris→Christian Zagel, MMI/HCI; broad names show all matches; cancelled, error and stale-day states); HCI demo lecturer = Prof. Dr. Christian Zagel. Office/staff part (Grosch, Katja, office-to-room mapping) still TODO and blocked on T34; demo sessions are not a real timetable (T21) Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T34 | P1 | T21 / campus input | Verify office/person and kitchen labels | Reza gathers dated sources; Ali applies confirmed shared data | WAITING_HUMAN | Grosch K1-105 recollection vs official K1-211; Katja/secretariat and communication/kitchen target pending confirmation; names/sources documented, no data edit Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T35 | P0 | T20 physical access | Diagnose Elo USB/macOS touch and portrait mapping | Ali diagnosis; Reza records; device/technical access needed | WAITING_HUMAN | Reported not working via USB-C adapter; official USB/driver documentation read, no cable/USB/driver test or installation performed. [Field-review tasks](../../hci/requests/2026-11-02-physical-kiosk-review.md) 2026-11-03: the audit Mac enumerated no Elo USB device and no Elo driver; the screen was not attached, so no hardware check was possible. Status unchanged. Stage 1 repeated the read-only check (0 Elo USB entries, 1 built-in display); screen not attached, nothing installed or changed. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T36 | P0 | T20; T35 for actual touch acceptance | Reachable lower public navigation; 4 + centred 3 | Ali shared public UI | IMPLEMENTED | Ali's request, 2026-11-02; seven destinations retained, admin excluded; physical reach boundary still to measure. **Implemented 2026-11-03 (Stage 1 / AL-02, Claude Code, uncommitted):** fixed bottom dock, language switch above 4 + centred 3, reserved space, shared contract [C10](../../contracts.md); technical checks in nominal emulation: typecheck 0, lint 0, unit 155/155, build 0, E2E 94/94 (19 new in `kiosk-dock.spec.ts`; red on V1 first, mutation-checked); evidence [`docs/evidence/v2-ali-stage-1-2026-11-03/`](../../evidence/v2-ali-stage-1-2026-11-03/README.md). **Not VERIFIED:** physical reach/touch (T35, T20) and human results NOT RUN; restart validation not run in Stage 1; no independent review yet. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T37 | P1 | T23; coordinate T36 | Readable public copy, remove repetitive developer prose | Ali shared copy/scale; Parsa booking; Reza newcomer copy | IN_PROGRESS | Shared English content note and duplicate explanations to review; functional feedback stays. **Stage 1 part done 2026-11-03 (uncommitted):** the shared note now appears only on schedule and rooms; kiosk scale (root 16 → 22 px at 1080 px) scoped to public pages (`kiosk-dock.spec.ts`). **Stage 2 (2026-11-04):** no new shared-copy change; Home/Newcomers/Rooms text came from existing strings. **Still open:** booking banners/copy (Parsa AP-04), newcomer text (Reza R-01), Home/Newcomers/Rooms copy (Stage 2); human readability NOT RUN. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T38 | P1 | T36,T37 | Larger Home cards, pictograms/images, lower visual focus | Ali Home layout/assets | IMPLEMENTED | Home functionality accepted by Ali; visual requests only, no new destinations **Implemented 2026-11-04 (Stage 2 / AL-03, Claude Code, uncommitted):** Home = six large pictogram cards (own SVGs, text labels kept, same hrefs), filling the portrait space above the dock; no photo or official logo (none supplied; none invented). Technical checks in nominal emulation: typecheck 0, lint 0, unit 164/164, build 0, E2E 127/127 (33 new, red on the Stage 1 build first, mutation-checked); [evidence](../../evidence/v2-ali-stage-2-2026-11-04/README.md). **Not VERIFIED:** human/physical result NOT RUN; no independent review yet. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T39 | P1 | T36,T37 | Simplified newcomer page and larger four primary actions | Reza content.ts copy; Ali newcomer page/layout | IN_PROGRESS | Remove large prototype block DE/EN, reduce small/long copy; existing fifth help card reviewed separately **Ali's layout part implemented 2026-11-04 (Stage 2, uncommitted):** prototype block removed in DE/EN (compact marker kept), 2 × 2 action cards + full-width secondary help card, pictograms; Reza's `content.ts` untouched and rendered verbatim. **Still open:** Reza's shortened copy and verified facts (R-01/T21); human check NOT RUN. [evidence](../../evidence/v2-ali-stage-2-2026-11-04/README.md) Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T40 | P1 | T36,T37 | Rooms placement/readability with search preserved | Ali room directory/search; Aryan map-link review | IMPLEMENTED | Rooms generally accepted; preserve search/day/room/language/history and existing floor grouping **Implemented 2026-11-04 (Stage 2 / AL-04, uncommitted):** floor chips (pinned in kiosk, focus to heading, no URL/history change), one-row room actions, search results ordered so matching classes are not contradicted by a leading 'no room' box, selected-day scope stated; Rooms 11.9 → 8.2 screens at 1080×1920 (text not shrunk), 17.3 → 12.2 at 540×960; `room-search.spec.ts` incl. SEARCH-R001 unchanged and passing. No office/staff mapping (T33/T34 open). Nominal emulation only; human check NOT RUN. [evidence](../../evidence/v2-ali-stage-2-2026-11-04/README.md) Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T41 | P1 | T36,T37 | Booking copy cleanup without flow/contract changes | Aryan+Parsa joint package; Parsa booking lead | TODO | Booking accepted; keep receipts/conflicts/cancellation and leave guard. Schedule/announcement layout accepted and to be preserved 2026-11-03: V2 audit proposal exists ([V2-P*](../../hci/v2-audit-2026-11-03/04-v2-proposal.md)); **not implemented**. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T42 | P1 | T35,T36–T41; T25 | Matched before/after, technical regression and physical retest | All owners supply before/after; Ali integration; Reza records/retest | IN_PROGRESS | **Stage 1 before/after (nominal emulation) exist for the dock/scale change** ([evidence](../../evidence/v2-ali-stage-1-2026-11-03/README.md), V1 copy `a7903db` vs working tree, same script/contexts/data). **Stage 2 before/after (Home, Newcomers, Rooms, Stage 1 tree vs Stage 2 tree) exist too** ([evidence](../../evidence/v2-ali-stage-2-2026-11-04/README.md)). Still none for map and booking; no working-touch test, participant result or V2 improvement claim. Current V2 assignment (2026-11-03): [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md); implementation/rehearsal not done by this planning update. |
| T43 | P0 | T19; T20 context | Playwright/UI-UX discovery before known-feedback comparison, then V2 proposal | Claude executes; Ali reviews findings/direction | IMPLEMENTED | 2026-11-03: audit-only master prompt prepared; relevant local skills inventoried, not executed by Claude. Disposable DB/installation, freeze Phase-A observations, disclose prior exposure, compare with T35–T42; no product fixes/commit/push. [Handoff](../../hci/v2-audit-2026-11-03/README.md) **Executed 2026-11-03 (Claude Code):** isolated copy of `a7903db` + fresh DB, nominal 1080×1920 touch emulation + sensitivity/laptop contexts, DE/EN; Phase A report frozen and hashed before the comparison; comparison, A-19/A-20 addendum and ranked V2 proposal delivered. Context-aware, **not blinded**; no hardware, human, screen-reader, Firefox/WebKit test. Awaiting Ali's review; not independently verified. [Reports](../../hci/v2-audit-2026-11-03/README.md), [evidence](../../evidence/v2-audit-2026-11-03/README.md) |

| T44 | P0 | T36 layout contract; T20 for physical acceptance | Map marker size, overlap and selection across floors | Aryan+Parsa joint; Aryan map lead | TODO | A-01 / V2-P5; AP-01 in [team tasks](../v2-team-2026-11-03/01-team-tasks-fa.md). Shared IDs/geometry retained; no implementation yet. |
| T45 | P0 | T36 layout contract; Ali/Parsa receipt decision | Booking receipt protection and confirm visibility; room schedule→booking | Aryan+Parsa joint; Parsa booking lead | IMPLEMENTED | A-03/A-04/A-05/A-20; AP-02/AP-03. 2026-11-04: delivered changes integrated with Ali review corrections, C12; combined evidence records actual checks. Physical touch/keyboard and human validation remain open. Preserve tokens/API/occupancy/pending safeguards; document receipt contract decision. |
| T46 | P1 | T36,T37 | Shared accessibility, page metadata and meaningful invalid-room state | Ali shared components; Parsa booking/schedule files | IN_PROGRESS | A-13/A-14/A-15/A-19; AL-05/AP-03. 2026-11-04: schedule404 state/cache invalidation and cancellation DE/EN metadata implemented with Parsa integration. Shared skip link/document language/semantics remain Stage3; no full compliance or screen-reader claim. |
| T47 | P2 | Ali decides whether to change the praised board | Optional “more notices below” cue; preserve announcement cards | Ali display components | DEFERRED | A-07 / AL-07. Explicitly optional; no auto-paging or board redesign. |

## Checkpoints

### V2-STAGE-1-INDEPENDENT-REVIEW — 3 November 2026 (Europe/Berlin)

- Codex reviewed the actual uncommitted Stage 1 source over `a7903db` and the reported evidence. Fresh isolated checks: typecheck/lint exit 0, unit 155/155 and build + Chromium E2E 94/94. The first build lacked Google Fonts network access; the network-enabled rerun passed on the same source, without mocks or skipped tests.
- A separate browser probe passed shell/board transitions, language switching, portrait/laptop resizing and English Rooms last-action scroll clearance (nine recorded checkpoints). No new blocking Stage 1 defect found within this checked scope. [Independent evidence](../../evidence/v2-ali-stage-1-review-2026-11-03/README.md).
- Stage 2 can proceed; T36 remains IMPLEMENTED because physical acceptance is open. T35 remains WAITING_HUMAN. T24/T37/T42 are still partial; no AP/Reza task, real-user study or complete V2 is marked done.
- Map markers, settled-receipt protection and booking-confirm visibility remain the accepted Aryan/Parsa handoff tasks; Stage 2 handles Home/Newcomers/Rooms and Stage 3 the remaining shared accessibility work. Original evidence (678 files, ~60.89 MB) was retained.
- No application edit, restart check, staging, commit, push, driver change or deployment. The 182-file runtime manifest and 12 protected-file comparisons matched after testing.

### V2-STAGE-2 — 4 November 2026 (Europe/Berlin)

- Ali sent Stage 2 of [`02-ali-claude-prompts.md`](../v2-team-2026-11-03/02-ali-claude-prompts.md) after Codex's independent review of Stage 1 (typecheck/lint, 155 unit, build, 94 browser passed; physical acceptance outstanding). Claude Code implemented **AL-03 and AL-04** in Ali's checkout on `main` at `a7903db`; **nothing staged, committed, pushed or deployed.** Changed: `app/page.tsx`, `app/newcomers/page.tsx`, `RoomDirectory.tsx`; new `Pictograms.tsx`, `public-pictograms.ts`, `search/results-layout.ts`, `stage2-layout.spec.ts`, two unit specs. Not edited: `newcomers/content.ts`, CampusMap, booking modules, DaySchedule, any existing test, API, schema, admin.
- **Result:** Home as six pictogram cards filling the portrait space; Newcomers without the coloured block (compact marker), 2 × 2 + full-width secondary help card, Reza's text verbatim; Rooms with floor chips, one-row actions, ordered search results and a stated one-day scope. Contract [C11](../../contracts.md); handoff [`04-stage-2-handoff.md`](../v2-team-2026-11-03/04-stage-2-handoff.md).
- **Checks actually run** (isolated copy, repo's own Playwright config on port 3100): typecheck 0, lint 0, unit **164/164** (155 + 9), build 0, E2E **127/127** (94 + 33). New spec red on the Stage 1 build first (31 failed); six mutations caught (21 failed). Restart validation NOT RUN. The first full run had 3 failures, explained and not Stage 2 defects: my own EN selector (fixed), `insecure-origin` hard-coding port 3100 while my scratch run used 3110, and the **pre-existing intermittent `map-integration` marker test** (1 of 3 isolated runs fail on the Stage 1 build too; Aryan's area, not edited).
- **Before/after** [evidence](../../evidence/v2-ali-stage-2-2026-11-04/README.md): same script on an isolated Stage 1 copy and the modified source, 6 contexts × DE/EN, screenshots opened and inspected, no credentials involved (no booking made).
- **Not established:** Elo screen not attached (read-only: 0 Elo USB entries; displays 5120×2880 and 3024×1964); T35, real viewport/reach/touch and all human results open; all sizes provisional; Chromium only.
- Stopped before Stage 3 as instructed.

### V2-STAGE-1 — 3 November 2026 (Europe/Berlin, evening)

- Ali sent Stage 1 of [`02-ali-claude-prompts.md`](../v2-team-2026-11-03/02-ali-claude-prompts.md); Claude Code implemented **AL-02 and the preparation part of AL-01** in Ali's checkout on `main` at `a7903db`. **Nothing staged, committed, pushed or deployed.** Runtime files changed: `PublicShell.tsx`, `PublicNav.tsx`, `BoardLayout.tsx`, `globals.css`; new `DockHeightSync.tsx`, `src/lib/public-layout.ts`, `tests/e2e/kiosk-dock.spec.ts`, `tests/unit/public-kiosk-layout.test.ts`. No existing test, API, schema, admin component or teammate-owned module (CampusMap, booking, DaySchedule, `newcomers/content.ts`) was edited.
- **Result:** portrait-kiosk dock (language switch above four tiles then three centred, fixed to the bottom edge, same navigation on `/display` inside its frame), kiosk rule by viewport/orientation only (portrait, ≥ 520 CSS px; not pointer type), root 16 → 22 px at 1080 px for public pages only, real dock height reserved as `--public-dock-h` (padding + scroll-padding), active state bar/underline, language gap 4 → 16.5 px, shared English note only where class titles appear. Contract [C10](../../contracts.md); handoff [`03-stage-1-layout-handoff.md`](../v2-team-2026-11-03/03-stage-1-layout-handoff.md); DESIGN.md addendum.
- **Checks actually run** (isolated copy of the modified source, clean `.next`): typecheck 0, lint 0 (185 files, 0 warnings), unit 155/155 (152 + 3 new), build 0, E2E 94/94 (75 + 19 new). New spec ran red against V1 first; mutation checks: removed reservation, left-aligned row, pointer-based rule — all caught (one weak focus test was found and strengthened; one stale-build mutation run is kept as invalid). Restart validation NOT RUN. Historical 152/75/13 counts (1 Nov) are separate.
- **Before/after:** [evidence](../../evidence/v2-ali-stage-1-2026-11-03/README.md) — same script on an isolated V1 copy and the modified source; 6 contexts × DE/EN; screenshots opened and inspected; receipt/cancel inputs masked; credential scan clean.
- **Side effects handed over, not fixed:** longer pages (`/rooms` 8.56 → 11.85 screens), booking confirm button further below the fold (Parsa AP-03), map markers larger but still < 44 px and overlapping (Aryan AP-01), dock first in tab order (skip link, Stage 3), ordinary-layout navigation 4 px lower.
- **Not established:** Elo screen not attached (0 Elo USB entries, 1 built-in display) — real viewport/zoom/DPR, reach, touch (T35) and every human result remain open/WAITING_HUMAN; all sizes provisional. Chromium only; no screen-reader/Firefox/WebKit.
- Stopped before Stage 2 as instructed.

### ALI-IMPLEMENTATION-PROMPTS-PREPARED — 3 November 2026

- Ali asked to start his own work by giving Claude implementation prompts. Prepared [three scoped prompts](../v2-team-2026-11-03/02-ali-claude-prompts.md): Stage 1 AL-01 baseline/available measurements + AL-02 kiosk shell; Stage 2 AL-03/04; Stage 3 AL-05/06 with actual teammate deliveries only.
- Sending a named stage authorizes its implementation and supersedes the earlier audit-only limit for that stage. This preparation turn does not execute it: all relevant implementation rows remain TODO, physical items stay WAITING_HUMAN as applicable. No runtime/DB/driver/test, branch, stage/commit/push or deployment change was performed here.
- Explicit boundaries: no takeover of CampusMap, booking/DaySchedule or Reza's content.ts; no optional T47 cue. First stage supplies the shared dock/space/query contract that the joint AP package needs. No repeated permission for routine authorized implementation choices.

### V2-TEAM-ASSIGNMENT-PREPARED — 3 November 2026

- At Ali's request, combined his field feedback, all A-01…A-20 audit/addendum items, V2-P0…P9 and open factual constraints into [one assigned plan](../v2-team-2026-11-03/01-team-tasks-fa.md).
- Ali owns shared UI, room directory, integration and final QA. Aryan+Parsa have a joint map/booking package (Aryan map lead, Parsa booking lead) and build the slide deck. Reza has lighter code work (`content.ts` only), compiles documentation, coordinates records and is the main presenter. Each member writes/tests/documents their own work and personal booklet section.
- T24 is TODO for the planned implementation phase; no runtime changes were made. Added T44 markers, T45 booking safety, T46 accessibility, T47 optional board cue. Historical source attribution and frozen audit are unchanged. This allocates work; it does not claim teammate acceptance of every UX trade-off or completion.
- Claude's reports were read and the frozen report SHA-256 matches its manifest. No independent browser reproduction or product-suite execution was performed in this planning checkpoint. No stage/commit/push or PowerPoint file was made.


### V2-AUDIT-EXECUTED — 3 November 2026 (Europe/Berlin)

- Claude Code executed the audit-first prompt (T43) in Ali's checkout: isolated production copy of `a7903db` (runtime-manifest hash equal to the original), fresh disposable SQLite, localhost port 3400, temporary credentials. Ali's `.next`, `data/`, `.env.local`, `.demo-data/` and manual DB were not touched; no process stopped; nothing staged, committed or pushed.
- Phase A: 8 routes × DE/EN in four labelled emulation contexts, task journeys (find room, map→room→schedule, lecturer/course search and day change, newcomer, schedule edge cases, booking conflict/receipt/expiry/cancel, leave guard, controlled errors, `/display` with 8 and 0 notices, touch swipe/zoom/drag, idle 95 s). 18 findings; report **frozen 17:30:17 CET, SHA-256 `5590f8ff…517c`**, before any known-feedback document was opened. Prior exposure (earlier conversation, `DESIGN.md`, file names) disclosed: **context-aware, not blinded**.
- Phase B: comparison matrix, post-freeze addendum (A-19 language-switch spacing, A-20 schedule→booking link, corrections), source-confirmed causes, ranked V2 proposal V2-P0…P9 with alternatives, files and acceptance checks, and seven decisions for Ali.
- Highest-impact evidenced items: 21/21 first-floor map markers 52.7×24 px with no gap and one hidden (A-01); receipt can be left by one tap with no guard and the cancellation code field is masked (A-03, A-04); confirm step below the fold (A-05); `/rooms` 8.6 screens (A-02); no "more" cue on `/display` (A-07).
- Not established: the physical touch failure (not rediscovered; Elo screen not attached), real CSS viewport/zoom/DPR, reach, visual-quality cause, human comprehension. `(pointer: coarse)` is true in emulation only because touch is emulated; the kiosk layout must not rely on it.
- Quality gates: whole-project lint still 177 files, 0 errors, 0 warnings with the audit scripts present; no product tests were run or changed (not needed for a documentation/audit run). Historical test counts (152 unit, 75 browser, 13 restart, 1 Nov) are unchanged by this checkpoint.
- Next: Ali reviews findings and decisions (`04-v2-proposal.md` §5); V2-P0 measurements on the real panel; T35 hardware diagnosis. T36–T42 stay TODO until Ali approves an implementation round.

### V2-AUDIT-HANDOFF-PREPARED — 3 November 2026

- Ali asked to start V2 with Claude's own Playwright/UI-UX investigation, using relevant installed skills sequentially, before feeding it proposed fixes.
- Codex prepared the full local prompt `Project/Claude-V2-AUDIT-FIRST-2026-11-03.md` and [execution brief](../../hci/v2-audit-2026-11-03/README.md). No Claude run, browser exploration, application tests or runtime changes have happened in this preparation checkpoint.
- The installed `webapp-testing` and ten related skill paths were found; Claude must check availability in its actual session. Official Playwright agent/emulation/screenshot docs were read. This is tool/preparation evidence, not an audit result.
- V2 audit/design preparation is initiated; T43 remains TODO until Claude executes it. Product implementation T24 stays DEFERRED for this audit-only run. Mandatory notes can reveal known issues, so no falsely blinded-discovery claim is permitted. Hardware touch/height and real human retests remain separate.

### PHYSICAL-REVIEW-RECORDED — 2 November 2026

- Ali requested **to-do recording only**. T35–T42 are requirements, not implementation authorization. T24 remains DEFERRED; T22 is not completed by a team member's review.
- Supplied settings show portrait 1080×1920 / 60 Hz / 90° / extended ELO ET4363L; the device photo label identifies E344056. Screenshot, user report and manufacturer documentation are separate evidence types.
- Reported issues: touch not working with USB-C adapter, high controls/reach, small/excess text; requested lower navigation, centred 4+3 layout, larger Home/newcomer cards, imagery and booking copy cleanup. Admin excluded; Schedule accepted; Announcements praised and preserved.
- Documentation only: request, screen specs, V2 planning follow-up, evidence index and Persian vault. No runtime/data/driver/system change, product test, commit or push. See `docs/evidence/field-review-2026-11-02/README.md`.

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
