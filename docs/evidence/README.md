# Evidence (app-side)

All runs on Ali's MacBook (macOS, Darwin arm64, Node 22.20), 2026-10-24, executed by Claude Code. Automated only; no human usability test, no second physical device, no campus screen.

| ID | What | File | Result |
| --- | --- | --- | --- |
| T-01 | Typecheck, ESLint, Vitest (37 tests: policy, schema/time incl. DST, repository/persistence, auth/sessions) | `logs/2026-10-24-static-and-unit.txt` | all pass |
| T-02 | Production build | `logs/2026-10-24-build.txt` | pass, no warnings |
| T-03 | Playwright E2E, 17 tests (API security, display states, two-context publish flow, validation, unsaved guard, logout, screenshots) | `logs/2026-10-24-e2e.txt` | 17/17 pass |
| T-04 | Real server restart (production build): publish + unsaved-draft edit survive restart | `logs/2026-10-24-restart-persistence.txt` | pass |
| S-01…07 | Screenshots: admin at 1440×900; display at simulated 1080×1920 and on a 1440×900 laptop window | `screenshots/` | inspected visually by Claude Code |

Limits: the two "devices" in T-03 are two browser contexts in one Chromium on one machine. Display connection loss is simulated by request interception. 1080×1920 is an assumption, not the measured screen. Contrast ratios were not measured with a tool.
