# Independent V1 review evidence — 2026-11-01

Reviewed HEAD `c2933f6`; runtime equivalent to `64d2801`. No application code was changed. See [`../../reviews/2026-11-01-integrated-v1-review.md`](../../reviews/2026-11-01-integrated-v1-review.md).

| File | Meaning |
| --- | --- |
| `run-info.json` | Exact commands, observed exit codes/counts and isolation limits |
| `build.log` | Successful direct production build |
| `baseline-e2e.log` | Existing browser suite: 60/60 pass |
| `restart.log` | PASS: 13 checks, isolated database |
| `review-booking.spec.ts.txt` | Two new reproducible review probes; kept outside the active suite because they currently fail |
| `new-probes-before-fix.log` | Both new probes fail at the intended incorrect-receipt assertions |
| `attempt-1-font-download.log` | Earlier attempt stopped before tests: font download |
| `attempt-2-build-process.log` | Earlier attempt stopped before tests: build-process port permission |

To reproduce the new cases in an isolated copy, copy `review-booking.spec.ts.txt` to `tests/e2e/review-booking.spec.ts` beside the existing helpers and run:

```bash
PLAYWRIGHT_NO_COPY_PROMPT=1 npx playwright test tests/e2e/review-booking.spec.ts --reporter=list
```

The `.txt` extension keeps this historical probe out of TypeScript/lint and the active test suite. The probe file disables trace, screenshots and video. The environment flag also suppresses the automatic page snapshot in the installed Playwright version; the two generated error contexts were checked and contained no page snapshot. Assertion values are booleans, never cancellation codes. Failure-artifact directories were not copied here. A credential-pattern scan of retained files found only broad-pattern false positives in generated filenames, and no literal token/Bearer values. This is a limited scan, not a guarantee about every possible secret pattern.

No physical kiosk, second-device or human test is represented by these files. No post-fix result is claimed.

## Corrected-version follow-up

The paragraph above describes the original pre-fix review. Fresh post-fix verification of HEAD `c7b9159` (runtime `9144cff`) is stored separately in [`corrected-verification/run-info.json`](corrected-verification/run-info.json) and adjacent logs: 136/136 unit tests, 13/13 relevant browser tests with their configured production build, typecheck and lint all passed. The full 66-test browser suite and restart were log-inspected, not rerun in this follow-up. The original failed probes remain unchanged as before-fix evidence.
