# Authoritative task board and execution checkpoints

Prepared by Codex on **31 October 2026**. **Execution has not started.** Historical audit results are in the brief/audit, not task completion for this new integration run.

Use these states: `TODO`, `IN_PROGRESS`, `IMPLEMENTED` (code present, acceptance not yet verified), `VERIFIED`, `WAITING_HUMAN`, `BLOCKED` (name the concrete blocker), `DEFERRED` (give reason). Mark a task VERIFIED only within its stated acceptance scope. A partial human-dependent task can remain WAITING_HUMAN while its prepared files and technical results are listed in Evidence.

This table is the single authority for task state. Update plan step checkboxes and Persian vault summaries in the same checkpoint; if they disagree, inspect evidence and correct the summaries. Never count a prepared test or report as a completed study.

| ID | Priority | Depends on | Deliverable | Executor / external input | Status | Evidence / commit |
| --- | --- | --- | --- | --- | --- | --- |
| T00 | P0 | — | Current state and start checkpoint | Claude | TODO | None for new run |
| T01 | P0 | T00 | Provenance and attribution ledger | Claude; joint split unknown | TODO | — |
| T02 | P0 | T00 | Safe integration branch + isolated DB | Claude | TODO | — |
| T03 | P0 | T01,T02 | Original Aryan map import | Claude import / Aryan source | TODO | — |
| T04 | P0 | T03 | Joint booking/map delta import | Claude import / joint source | TODO | — |
| T05 | P0 | T04 | Reza verbatim import + separate integration | Claude import / Reza source; Ali wiring | TODO | — |
| T06 | P0 | T04,T05 | Working integration contracts | Claude / Ali's requested scope | TODO | — |
| T07 | P0 | T06 | Unified seed + stable geometry IDs | Claude | TODO | — |
| T08 | P0 | T04,T06 | Pending request/receipt fix | Claude | TODO | — |
| T09 | P0 | T07,T08 | Explicit selection + request states | Claude | TODO | — |
| T10 | P0 | T06,T07 | Atomic occupancy / API / eligibility | Claude | TODO | — |
| T11 | P0 | T07 | Live-ID map in shared shell | Claude adapting Aryan source | TODO | — |
| T12 | P0 | T05,T11 | Shared navigation/query/language | Claude | TODO | — |
| T13 | P0 | T08,T09,T10,T12 | Localized booking/receipt/cancel | Claude | TODO | — |
| T14 | P0 | T10 | Minimal Katja booking UI | Claude | TODO | — |
| T15 | P0/P1 | T05,T12 | Working newcomer entry/content | Claude; Reza factual input in T21 | TODO | — |
| T16 | P0 | T08–T15 | Clean lint, regression and docs | Claude | TODO | — |
| T17 | P0 | T16 | Full acceptance + restart/races | Claude | TODO | — |
| T18 | P1 | T00 | Research templates/change ledger | Claude; humans supply results | TODO | — |
| T19 | P0 | T17,T18 | Frozen/shareable integrated V1 | Claude | TODO | — |
| T20 | P1 | T00; T19 for app check | Real screen / second device | Reza/Ali; Claude prepares | TODO | — |
| T21 | P1 | T00 | Facts, provenance, Moodle dates | Reza/team; official sources | TODO | — |
| T22 | P1 | T18,T19 | Actual human task observations | Humans; Claude processes records | TODO | — |
| T23 | P1 | T18,T19; add human data when available | Ranked V2 decisions | Claude + actual evidence | TODO | — |
| T24 | P1/P2 | T23 | Selected UI/UX V2 changes | Claude | TODO | — |
| T25 | P1 | T24 | Current regression + human retest | Claude / actual participants | TODO | — |
| T26 | P1 | T18; latest real evidence | Attributed booklet draft/final | Claude draft / each member review | TODO | — |
| T27 | P1 | T19; latest V2 if ready | Short demo + rehearsal status | Claude prepares / presenter rehearses | TODO | — |
| T28 | P1 | T19; final completed code | Reviewable branch/docs/package | Claude | TODO | — |
| T29 | P1 | Current checkpoint | Follow-up packet and vault sync | Claude | TODO | — |

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
