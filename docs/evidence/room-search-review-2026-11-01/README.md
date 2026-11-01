# Independent room-search review evidence — 1 November 2026

Reviewer: Codex. Base `452d893` with Claude's uncommitted search implementation. Findings: [SEARCH-R001](../../reviews/2026-11-01-room-search-review.md). No runtime edit, data mutation, staging, commit or push.

| Evidence | Result and scope |
| --- | --- |
| `checks.json` | Fresh unit run: 152/152, 19 files, exit 0; source hashes and distinctions from Claude's existing logs |
| `navigation-probe.json` | Two browser probes against the existing production build, both fail from one URL/state bug; fixtures intercepted at public APIs, temporary DB, no login |
| `back-after-edit.png` | German view after Back retains the edited English-view query/day; synthetic public data only |
| `demo-readonly-check.json` | SQLite read-only comparison to Claude's backup: integrity ok, only the three HCI lecturer/update-time pairs differ |

The probe script is retained outside Git at `/private/tmp/hci-search-review-2026-11-01/probe.mjs`; the reproducible UI steps and expected regression scope are in the review. Port 3341 server stopped. An initial environment-denied server attempt and probe cleanup failure are recorded separately in `checks.json`, not counted as application test results.

Claude's original full logs remain in `../room-search-2026-11-01/`. Codex did not rerun the full browser/build/restart suite. These are automated technical observations, not human participant results or measured UX benefit.
