# Aryan AP01 repaired integration — 4 November 2026

**Reviewed runtime commit:39a7d8d; original import:9b6eaba.**

**Final technical state: typecheck and lint clean,187 unit tests,153 browser tests, production build and13 restart checks pass.** This checkpoint is accepted a089f73 plus Aryan AP01 and Ali’s review fixes. Claude’s unfinished Stage3 is explicitly excluded and preserved. No human/Elo/screen-reader test or remote push was performed.

## Changes and attribution

| Finding | Original evidence | Repair | Verification |
| --- | --- | --- | --- |
| R001 / P1: fixed72×44/44×44 arithmetic disagreed with rem-scaled kiosk controls | Prior real DOM probe:8/72 cases overlap;1080fit105/108 and zoom2 115/118 examples | Measure actual CSS hit dimensions with shared-class sizing probes; observe resizing and calculate groups from those values | New scale unit cases and real-browser rectangle regression; final72-case matrix:0 overlaps,0 page errors |
| R002 / P2: focused chooser removed on close/selection | Four initial browser regressions failed on original patch | Return to opener on Close, focus room details on choice | Named regression cases pass |
| R002 follow-up: live archive/regroup removes focused chooser; restoring member reopens it | Independent review, reproduced red runs | Stable React19 pre-removal callback-ref cleanup, BODY-only restoration, discard invalid expanded key | Archive/restore tested with focus inside chooser and outside in search; both pass, no unexpected reopen |
| R003 / P2: English chooser omitted German fallback marker | Original red browser regression | Use existing FallbackTag next to localized name | German-only name marked in English chooser |
| I001: legacy tests assumed every room had a single marker and sampled boxes in different frames | Failing rename test; earlier intermittent coordinate assertion | Accept single OR cluster ID without removing floor/name checks; isolate coordinate pin and read both boxes in one frame | All existing map tests pass |

Aryan supplied the grouping/chooser concept and original4-file patch,17 unit tests and2 browser tests. Ali/Codex supplied the integration corrections,4 additional scale unit cases and6 browser regressions. IDs, positions, APIs, schema, booking invariants and credentials were not redesigned. [Provenance](../../team-sources/aryan-ap01/README.md), [C13](../../contracts.md#c13-measured-map-groups-and-chooser-lifecycle-aryan-ap01-2026-11-04).

## Checks actually run

| Check | Final result | Log |
| --- | --- | --- |
| `npm run typecheck` | exit0 | `logs/39-typecheck-final.log` |
| `npm run lint` | exit0,0 warnings/errors | `logs/40-lint-final.log` |
| `npm test` |187/187,25 files | `logs/41-unit-final.log` |
| Focused AP01 regressions |6/6, fresh build/database | `logs/42-focus-final.log` |
| `npm run test:e2e` |153/153, original3100 config including insecure-origin case; production build succeeds | `logs/43-full-final.log` |
| `bash scripts/verify-restart.sh` |PASS13, isolated SQLite, no public/private-state loss after restart | `logs/44-restart-final.log` |
| Real DOM geometry / DE+EN selection and settled focus probe |72 contexts,0 overlap cases,0 page errors | `observations.json`, `logs/46-matrix-final.log`,14 public screenshots |
| Independent code review | No remaining actionable findings in final reviewed focus logic | `independent-review.txt`; reviewer ran no tests/writes |

Matrix:1080×1920,900×1600,540×960 and1440×900; DE/EN;1OG/2OG/3OG;zoom1/1.5/2. This is browser emulation, not physical measurement. Raw observations retain root sizes and actual target rectangles. Coordinate/ID data is unchanged. `validated-source-manifest.json` binds the tested source to hashes; generated historical screenshots are excluded from the accepted diff.

## Earlier failed runs and harness corrections

These are retained, not converted into passes:

- `03-scale-red.log`: original fixed-size helper failed3/4 new measured-size cases. `04-browser-red.log` was an **invalid browser start** because the new unit test’s extra argument initially caused a TypeScript build error. After type-safe test adaptation, `05-browser-red-valid.log` reproduces all4 original browser defects.
- `09-focused-green.log` and `10-full-e2e.log`: first repair passed13 focused cases and151 full browser cases before the live-regroup scenario was added.
- `11-live-focus-red.log`:1 fail/1 pass proves missing focus restoration on live archive while outside search focus is retained. The layout-effect cleanup attempt did not fix it: `16-full-e2e-final.log` contains152 passes/1 failure. It was replaced by pre-removal React19 ref cleanup.
- `34-ref-cleanup-focus.log` / `35-typecheck-source-import.log`: copying executable source examples under docs made Next typecheck their old relative imports. The original submission is now kept as an immutable ZIP plus manifest, not added to the app compiler. No compiler exclusion was introduced to hide product errors.
- `36-ref-cleanup-restore-red.log` had a double-restore cleanup409 that obscured the main failure. `37-restore-red-valid.log` still had an ambiguous locator. Neither is claimed as a valid product regression. The corrected `38-reopen-red.log` fails both cases specifically because the chooser unexpectedly reopens. Clearing the obsolete group key fixes them; `42` and `43` are the valid final green runs.
- The first standalone focus probe inspected immediately after Enter, before requestAnimationFrame restoration. The final probe waits for the expected focused opener before recording it. No instant-read transient is presented as an unresolved final product defect.

## Preservation and privacy

`preservation-check.json`:12 active Stage3 file hashes unchanged,9 protected original files (env, real/demo database state and existing BUILD_ID) unchanged,25 source-delivery files unchanged. Private protected hashes are not published. `stage3-preserved.json` identifies public source bytes only. Original source PDFs/patches remain in the immutable archive and the external review. Frozen V1/audit evidence is preserved. The final tested clone has its own node_modules/.next/temporary databases; the original data files were never seeded.

Only public screenshots, source manifests and sanitized technical logs are included (temporary paths normalized and trailing whitespace removed; test content/results retained). No .env, database, cancellation credentials, admin passwords, trace ZIPs or failure-context files are included. Public temporary IDs in the restart log are synthetic. Temporary probe servers were stopped and temporary auth files removed after collection. Ali controls all remote publication.

## HCI deliverables and open work

- [Editable five-slide PPTX, PDF backup and German speaking script](../../hci/presentation/v2/README.md): original layout overlap fixed, Katja restored, actual public view replaces admin-on-kiosk cover, Fitts wording/status corrected. All final slides rendered/inspected and package validated. **PowerPoint application check, team approval and rehearsal NOT DONE.**
- [Aryan five-page editable booklet working draft](../../hci/booklet/aryan-ap01/README.md): rendered/inspected; original/integration contributions separated. **Aryan approval and complete team booklet still open.**
- No survey answers, interviews, participant counts, task timings, measured UX benefit or touch success invented.
- Stage3, real Elo touch/reach/viewport investigation, factual campus content/Moodle confirmation and outside-user tests/retest remain open. This report does not certify the dirty Stage3 files or the live localhost3000 build.
