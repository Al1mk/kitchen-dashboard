# Independent review of Ali's V2 Stage 1 — 3 November 2026

Codex reviewed Claude Code's Stage 1 implementation against the [authorized Stage 1 prompt](../../plans/v2-team-2026-11-03/02-ali-claude-prompts.md) and the [layout handoff](../../plans/v2-team-2026-11-03/03-stage-1-layout-handoff.md). The base is `main` at `a7903db512b6e98ebbe7783ddc64c2da89543a23` with the actual uncommitted Stage 1 runtime files. This review did not implement Stage 2, change application code, stage, commit or push anything.

**Outcome:** no new blocking Stage 1 defect found in the reviewed source and checked Chromium flows. Stage 2 can proceed using the shared layout contract. This is technical verification within the tested scope, not physical-screen acceptance or a finding that human usability improved. T36 remains IMPLEMENTED while physical acceptance is outstanding; T35 remains WAITING_HUMAN.

## Fresh checks performed by Codex

The candidate was copied from the modified working tree, including untracked runtime/test files and audit helpers. It had its own dependencies, build output and disposable databases. No `.env.local`, real database or manual-test database was copied. The [source manifest](source-manifest.json) covers 182 runtime/config files and still matched the working tree when the checks finished.

| Check | Actual outcome | Evidence |
| --- | --- | --- |
| Typecheck (`next typegen` + TypeScript) | exit 0 | [log](logs/typecheck.log) |
| Whole-project lint, including copied audit helpers | exit 0 | [log](logs/lint.log) |
| Unit suite | **155 passed**, 20 files | [log](logs/test.log) |
| Initial production-build/E2E attempt | build could not fetch the two existing Google fonts; browser tests did not start | [initial log](logs/e2e.log) |
| Production build and full E2E suite with network access | build succeeded; **94 passed**, exit 0 | [successful run](logs/e2e-network.log) |
| Additional independent browser probe | passed, nine recorded checkpoints, no page errors | [results](probe-results.json), [log](logs/probe.log), [reproducible script text](transition-probe.mjs.txt) |
| Protected-state comparison | **12/12 files unchanged**, including `.env.local`, real/manual database files and the original build ID | [check](protected-state-check.json) |
| Restart validation | **not run**; no data/API change in Stage 1 | — |

The first build failure was an environment/network limitation before browser testing, not a failing product assertion. The successful run rebuilt the same candidate with network access; font mocks, source changes and test skips were not used to obtain a pass. The existing remote-font dependency means a cold production build needs access to Google Fonts.

## Source, visual and interaction review

- Verified the six Stage 1 runtime files and the two new specs. Map, booking, DaySchedule, newcomer content, existing tests and admin code were not edited by Stage 1.
- Inspected Claude's existing full-size English Home, narrow English Home and German populated-board screenshots. Also captured [a fresh pointer-fine English Home screenshot](home-pointer-en.png).
- Independently checked pointer-fine portrait mode, a DE → EN link transition, shell → announcement-board → Rooms transitions, landscape/laptop resizing, narrow portrait resizing and return to full portrait. The root scale and reserved dock space were removed/reapplied as appropriate; there was one primary navigation and no horizontal overflow in those checkpoints.
- Measured the shared dock at 311 px in a 1080×1920 context and 227 px in a 540×960 context. These are nominal browser measurements, not the physical panel's CSS viewport or a reach measurement.
- Checked `scrollIntoView({ block: "nearest" })` and `block: "end"` for the last English Rooms action at 540×960: its bottom was about 716.7 px and the dock began at 733 px. This adds evidence for that action/context only; it does not test Parsa's future booking-confirm implementation.
- Read the stored red/mutation-run evidence; did **not** rerun those historical mutations. The first spec did have two mistaken navigation selectors. In the corrected V1 log the two ordinary-layout tests pass; its one remaining failure is the expected missing kiosk scale. The explicitly labelled stale-build mutation log is not positive evidence.

## Remaining work and scope

1. **Ali, Stage 2:** Home/Newcomers layout and a shorter, clearer Rooms experience. Enlarged text alone lengthens Rooms; the reported 8.56 → 11.85 screens is an open design tradeoff, not a measured usability improvement.
2. **Aryan/Parsa:** map-marker overlap and size, settled-receipt protection, cancellation usability and bringing the booking-confirm action into view. Stage 1 preserves the existing pending-request guard; its larger type places confirmation further down the page. These accepted owner tasks remain open.
3. **Ali, Stage 3:** skip link and remaining shared accessibility work. The dock is visually last but comes before content in keyboard order.
4. **Physical/human checks:** actual Elo viewport, browser zoom/DPR, touch diagnosis, mounting/reach and on-screen keyboard remain unverified. No screen reader, Firefox or WebKit run; no participant test. The 520 px rule and the dock's share of a narrow viewport remain provisional.

The ordinary-layout navigation's documented 4 px vertical shift is not a blocking regression. The optional announcement “more notices” cue stays deferred. No receipt lifetime, token, API, persistence or idle-reset policy was changed or approved by this review.

## Evidence handling

Logs were checked for obvious credential patterns and scratch paths were replaced with `<isolated-review>`. Only the additional public Home screenshot was copied into this evidence folder; the E2E suite's regenerated screenshots stay in the isolated copy. No receipt credentials or private device images are included here. The temporary probe admin credential file was deleted and the temporary servers were stopped. Protected-state hash values are retained privately in the scratch directory; this folder publishes only comparison outcomes.

Claude's original Stage 1 evidence remains intact: 678 files, approximately 60.89 MB. No pruning, staging or publication was performed. Select representative before/after pairs for the booklet/deck; a later packaging decision can reduce what is committed without rewriting the original findings.
