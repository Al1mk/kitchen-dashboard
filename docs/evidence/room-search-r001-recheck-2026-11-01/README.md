# SEARCH-R001 independent recheck — 1 November 2026

Reviewer: Codex. Base `452d893` plus Claude's uncommitted correction. **SEARCH-R001 resolved in the checked scope.**

- Fresh `npm test`: 152/152 in 19 files, exit 0.
- Fresh public-browser probes: 7/7, exit 0. Back restores the earlier German query/day; Forward restores the edited English entry; language switch preserves edited values; bare Rooms clears filters; Back restores that filtered entry; fast typing retains all characters without document navigation; clear restores focus.
- The original two probes failed before the correction and pass now. Added checks extend the navigation sequence without real people/admin credentials.
- Browser probes use the existing production build with synthetic public API fixtures and a disposable database, port 3342. The temporary server stopped afterwards. No fresh independent build/full E2E/restart run.
- Claude's correction logs were inspected: typecheck/lint/build green, browser 75/75, restart PASS 13. These are Claude's recorded runs, not reruns by Codex.
- Fixed-slot `beforeAll` collisions after a failed test or `--repeat-each` are a documented test-harness limitation, not a remaining SEARCH-R001 app finding.
- No application source, valued database, credentials or original evidence changed by this recheck. Nothing staged, committed or pushed. No human usability, screen or second-device test.

Artifacts: `navigation-probe.json`, `checks.json` (scope/source hashes). Original review: [SEARCH-R001](../../reviews/2026-11-01-room-search-review.md).
