# Evidence (app-side)

All runs on Ali's MacBook (macOS, Darwin arm64, Node 22.20), 2026-10-24, executed by Claude Code. Automated only; no human usability test, no second physical device, no campus screen.

| ID | What | File | Result |
| --- | --- | --- | --- |
| T-01 | Typecheck, ESLint, Vitest (37 tests: policy, schema/time incl. DST, repository/persistence, auth/sessions) | `logs/2026-10-24-static-and-unit.txt` | all pass |
| T-02 | Production build | `logs/2026-10-24-build.txt` | pass, no warnings |
| T-03 | Playwright E2E, 17 tests (API security, display states, two-context publish flow, validation, unsaved guard, logout, screenshots) | `logs/2026-10-24-e2e.txt` | 17/17 pass |
| T-04 | Real server restart (production build): publish + unsaved-draft edit survive restart | `logs/2026-10-24-restart-persistence.txt` | pass |
| S-01…07 | Screenshots: admin at 1440×900; display at simulated 1080×1920 and on a 1440×900 laptop window | `screenshots/` | inspected visually by Claude Code |

### After the review fixes R-001…R-004 (2026-10-25, same machine, executed by Claude Code)

| ID | What | File | Result |
| --- | --- | --- | --- |
| T-05 | Typecheck, ESLint, Vitest (38 tests: previous 37 + seed uses `.env.local` DB path) | `logs/2026-10-25-static-and-unit.txt` | all pass |
| T-06 | Production build | `logs/2026-10-25-build.txt` | pass, no warnings |
| T-07 | Playwright E2E, 19 tests (previous 17 + long-content overflow + editor on non-secure HTTP host) | `logs/2026-10-25-e2e.txt` | 19/19 pass |
| T-08 | Restart check with assertions | `logs/2026-10-25-restart-persistence.txt` | PASS: 5 checks, exit 0 |
| T-09 | Restart check negative variants (deleted DB, wrong password, port in use) | `logs/2026-10-25-restart-negative-checks.txt` | each FAIL, exit 1 (as intended) |

The new regression tests were each run against the unfixed code first and failed (overflow: 3 of 3 cards clipped; insecure host: client error page; seed: default database written). T-07 re-ran the screenshot spec; because short-content layout is visually unchanged, the original 2026-10-24 screenshots were kept (regenerated files discarded).

Limits: the two "devices" in T-03 are two browser contexts in one Chromium on one machine. Display connection loss is simulated by request interception. 1080×1920 is an assumption, not the measured screen. Contrast ratios were not measured with a tool. The non-secure-host test (T-07) uses a host name mapped to 127.0.0.1 inside one Chromium on one machine and a session cookie injected from a localhost login; it is not a LAN or second-device test.
