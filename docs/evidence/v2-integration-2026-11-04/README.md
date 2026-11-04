# V2 combined integration — 4 November 2026

**Implemented and technically verified; awaiting Ali’s manual push and later Stage3.** Ali explicitly authorized Codex to integrate Parsa’s delivered work and fix the review findings after Claude completed Stage2. Branch: `integrate/v2-ali-parsa-20261104`, baseline `a7903db`. No push, merge or deployment was performed. This is V2 **in progress**, not a completed HCI acceptance.

## Source, ownership and verification boundary

Ali’s existing Stage1/2 working tree was preserved. [Parsa source provenance](../../team-sources/parsa-v2/README.md), [original submitted diff](parsa-submission.patch); all39 anchors across eight files matched the completed Stage2 snapshot before adaptation. No installer ran over the dirty checkout and no whole-project ZIP replaced it. Parsa’s submitted changes and Ali/Codex’s subsequent fixes are distinguished in [contributions](../../contributions.md). The German booklet source is an explicitly edited derivative; the original archive/photos remain unchanged outside Git.

Build/browser tests used an isolated copy, its own dependencies/build and disposable SQLite. [Source manifest](validated-source-manifest.json) matches **189 files** in the active checkout; [comparison summary](source-check.json) records the hash. Nine protected original files, including private env, manual databases and original `.next/BUILD_ID`, matched before/after; their private hashes are not published. No production DB was seeded.

## Actual final checks

| Check | Result / evidence |
| --- | --- |
| Typecheck | exit0, [13](logs/13-typecheck-final.log) |
| Whole-project lint, active checkout including new audit tool | exit0, zero lint errors/warnings, [15](logs/15-active-lint.log) |
| Unit suite, active final source | **166/166**,23files, [16](logs/16-active-unit.log) |
| Production build + complete repository E2E config, port3100 | **145/145**,0failed/0skipped, [14](logs/14-e2e-final.log) |
| Restart persistence, final build and fresh temporary DB | **PASS13**, [17](logs/17-restart-final.log) |
| Masked visual probe | four contexts:1080×1920 and540×960, DE/EN;36screens, no page errors; [observations](after/observations.json), [log18](logs/18-visual-final.log) |
| Independent read-only code review | no unresolved actionable finding in Stage1/2 and combined booking/cache fixes; reviewer did not execute tests |
| Previously intermittent map-position test | **20/20** fresh repetitions pass, [20](logs/20-map-stability-baseline.log); no map code/assertion changed, historical intermittency remains open |

Node prints a terminal `NO_COLOR`/`FORCE_COLOR` environment warning in browser-run logs; this is not an app or lint error. No screen reader, Firefox/WebKit, native keyboard, physical Elo screen, working touch/reach or human study was run. Test counts are test cases, **not participants**.

## Review findings and corrections

| Finding | Correction | Fail-before / pass-after |
| --- | --- | --- |
| PARSA-R001 P1: shorter pending warning omitted that the booking may already exist | Explicit DE/EN existence and credential-loss warning restored, existing meaningful abandonment assertion retained | two unit failures [01](logs/01-warning-copy-red.log); final166unit + pending E2E pass |
| PARSA-R002 P1: extra final-15-seconds row pushed More time behind the dock | Countdown and concise warning share a reserved grid cell; no layout/scroll jump | original combined-source red [02](logs/02-review-regressions-red.log); six DE/EN×size geometry cases pass before clicking |
| R002 follow-up: screenshots showed Done partly obscured at540px | Two action columns throughout kiosk mode; both keep min-height64px at540, phones below520 stay stacked; old focus test now acknowledges and asserts real focus | two failures [12](logs/12-done-layout-red.log), final [14](logs/14-e2e-final.log); both buttons bottom697.66 < dock733 in DE/EN, unchanged at warning |
| PARSA-R003 P2: unknown schedule room looked like outage | Localized unavailable-room state and All rooms recovery preserving day/language; hook exposes HTTP status and discards stale404 data | [02](logs/02-review-regressions-red.log); initial integration review additionally caught404→outage resurrection, red [04](logs/04-404-network-red.log), fixed and final green |
| PARSA-R004 P2: EN cancellation document title was German | Installed Next16 `generateMetadata` using searchParams, DE default retained | [02](logs/02-review-regressions-red.log), DE/EN final green |
| PARSA-R005 P2: Map photo cited as Schedule | Corrected [booklet working basis](../../team-sources/parsa-v2/BOOKLET_BASIS_DE.md); original file/name untouched, never claimed as schedule evidence | source/photo inspection in original review; final caption inspected |
| PARSA-R006 P2: literal code-entry hints incomplete | No capitalization/correction/spellchecking requested on both fields; described36-/43-character/paste guidance; show/hide retains value | [02](logs/02-review-regressions-red.log), DE/EN final green; native-keyboard behaviour unverified |

The existing token lifetime,60-second receipt, More time, no-general-idle policy, IDs/APIs and atomic booking/class conflicts are unchanged. Saved acknowledgement gates Done; it does not provide recovery after expiry/forced exit. In-app receipt links ask first; a same-page language-only switch preserves the receipt. Browser Back/forced close remains best effort. C7/C10 are updated and [C12](../../contracts.md#c12-combined-parsa-v2-integration-2026-11-04) records the combined contract.

## Run history and image labels

- [02](logs/02-review-regressions-red.log): seven intended failures/one existing German-title pass on original Parsa+Stage2. [03](logs/03-focused-green.log):19targeted pass after first fixes.
- Independent review found stale404→network resurrection; [04](logs/04-404-network-red.log) failed and [05](logs/05-review-fixes-green.log) passed8/8 after invalidating the cache.
- [09](logs/09-e2e-combined-first.log): first full145pass; subsequent screenshot inspection found Done obstruction, which the old geometry test missed. [12](logs/12-done-layout-red.log) proves it before correction; final [14](logs/14-e2e-final.log) passes145again after measuring both controls.
- [19](logs/19-map-stability-baseline.log) is an **invalid probe launch**, no tests matched the anchored title filter; corrected filter in20ran20actual cases. No map assertion was weakened or skipped.
- `before/540x960-en-original-parsa-warning.png` is the earlier independent review’s **Parsa-on-Stage1** capture, not a matched Stage2 baseline. `before/540x960-en-intermediate-done-obstruction.png` is this integration’s intermediate first-fix capture. `after/` contains the final combined build. Room fixture identifiers differ; numeric bounds and source labels explain the comparison.
- Receipt ID/code are masked. Raw Playwright reports, traces, error-context snapshots, private environment files, SQLite files and admin.json are excluded. Logs are path-sanitized and scanned for obvious credential patterns; original private copies stay outside Git.

## Remaining work

Claude Stage3: shared skip/focus/document-language/heading/accessibility work, remaining readiness checks and Ali’s truthful booklet draft. Aryan: map-marker interaction plus shared deck; Parsa: own HCI chapter, module/user-check and deck assets; Reza: verified concise content, real-device/user coordination, editorial/presentation work. Every member’s individual contribution remains required. Physical acceptance, human testing, real campus facts, final deck/rehearsal and course submission checks are still open; no fabricated completion or measured UX benefit is claimed. [Manual run guide](../../run-guide.md#v2-integration-walkthrough-4-november-2026).
