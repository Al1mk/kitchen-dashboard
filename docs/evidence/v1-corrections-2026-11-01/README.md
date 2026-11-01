# V1 technical corrections — evidence, 1 November 2026 (Europe/Berlin)

Corrections for the independent-review findings V1-R001 and V1-R002 ([review](../../reviews/2026-11-01-integrated-v1-review.md)). Executed by Claude Code (AI assistant) for Ali on branch `integrate/team-v1-20261031`, in the working copy with temporary databases (Playwright config: fresh temp DB per run). The real `data/` database was not used; its three file checksums were identical before and after all runs.

This is a **technical correction** of integrated V1 (`64d2801`), not a human-tested V2 and not evidence of better task completion.

## Source states

| State | Meaning |
| --- | --- |
| `c2933f6` | Reviewed HEAD; runtime identical to `64d2801` |
| `83efaac` | Review documents committed unchanged (no runtime change) |
| `9144cff` | Correction commit: `src/components/public/{BookingFlow.tsx,BookingReceipt.tsx,booking-copy.ts,booking-result.ts}` + tests. The acceptance checks below ran on the working tree that was then committed without further edits as `9144cff` (`acceptance/run-info.txt` hashes only the tracked-file diff; new files were untracked at that moment). |

## Red → green

| File | Command | Result |
| --- | --- | --- |
| `R001-R002-before-fix.log` | `PLAYWRIGHT_NO_COPY_PROMPT=1 npx playwright test tests/e2e/review-booking.spec.ts --reporter=list` on unchanged runtime (`c2933f6`), probe copied verbatim | exit 1, **2/2 failed** at the intended assertions (cancelled replay claimed "Booking saved"; English receipt lacked English room name) |
| `new-regressions-on-original-runtime.log` | The 4 new tests (`--grep "V1-R00"`) against the original runtime files temporarily restored | exit 1, **4/4 failed** at behavioural assertions (no cancelled state; name stayed "Belegraum"; unknown state not recoverable) — shows the new tests are sensitive. Ran with an earlier, broader assertion wording; one assertion dumped the receipt text, so 6 occurrences of a cancellation code from the disposable test DB were **redacted** in this log (noted at its end) and all receipt text assertions were narrowed to code-free elements before the commit. |
| `R001-R002-after-fix-targeted.log` | 3 booking spec files incl. the probes, after the fix | exit 0, **13/13 passed** (run before the assertion narrowing; the final versions pass in the full run below) |

## Full acceptance on the corrected code (`acceptance/`)

| Check | Exit | Count |
| --- | --- | --- |
| `npm run typecheck` | 0 | — |
| `npm run lint` | 0 | 0 problems |
| `npm test` | 0 | **136/136** in 18 files (previous 134 + 2 new unit tests) |
| `npx vitest run tests/unit/booking-concurrency.test.ts` | 0 | 3/3 (separate SQLite connections) |
| `npm run build` | 0 | — |
| `PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e` | 0 | **66/66** (previous 60 + 2 review probes + 4 new regressions); screenshots of this run went to a scratch folder, not into the repository |
| `bash scripts/verify-restart.sh` | 0 | PASS: 13 checks |

`PLAYWRIGHT_NO_COPY_PROMPT=1` was checked in the installed Playwright 1.64.1 (`node_modules/playwright/lib/index.js`, `_takePageSnapshot` returns early). The two before-fix `error-context.md` files contained no page snapshot. Generated `test-results/` and `playwright-report/` were deleted, not copied. Credential scan of this folder (43-character base64url, `Bearer`, password hashes): only the non-secret booking ID, a patch hash and test-folder names match.

## Clean demo screenshots (`clean-demo-screenshots/`)

14 PNGs: start (DE, EN), newcomers, map (K1-120 selected), schedule, booking selection (no receipt), display — each at 540×960 and 1080×1920. **Browser-simulated portrait viewports, not measured campus-screen specifications.**

Made from a brand-new disposable database seeded only with `npm run db:seed-demo` and `db:seed-team-demo -- --yes` (no test fixtures; script aborted if `ADMS-`/`API-`/`PEND-`/`RCPT-`/`REVIEW-` codes or a receipt appeared), served by the production build of `9144cff` on a temporary port, captured with Playwright (viewport only). Demo rooms/sessions are labelled “Demo/Beispiel” and are not campus facts. The original V1 screenshots in `../integration-2026-10-31/screenshots/` are unchanged.

Not run: physical screen, second device/LAN, human usability sessions, GitHub publication.
