# Team package audit evidence — 31 October 2026

See [the source audit](../../reviews/2026-10-31-team-source-audit.md) for interpretation and limitations. These files document an isolated candidate based on `4ae9808`, not a merge into main.

| File | Evidence |
| --- | --- |
| `source-manifest.json` | SHA-256 and sizes of the 67 supplied files; paths relative to the course directory |
| `source-comparison.json` | Original 47 records/images preserved; 48 candidate records, 21 bookable codes, K1-114 unpositioned |
| `typecheck.log` | Successful route generation / TypeScript check |
| `unit.log` | 96 unit tests passed |
| `lint.log` | One error and three warnings |
| `build-fresh-cache.log` | Final successful production build |
| `e2e.log` | Existing suite: 31 passed, one archive-wording assertion failed |
| `runtime-probes.json` | Actual production HTTP/SQLite probes and the stable-ID map redirect defect |
| `browser-probes.json` | Static map and isolated booking-client behavior; fetch is mocked for the booking component |
| `repository-probes.json` | Actual SQLite repository probes for code-edit eligibility and free-span boundaries |
| `package-verifier.log` | Supplied verification script fails on missing distribution folder |
| `map-portrait.png` | Actual static map rendered in Chromium at 1080×1920; not the campus screen |

No passwords, cancellation-token values or session cookies are intentionally included. Logs were scanned for the relevant credential patterns before copying. Databases, `.env` files, traces, the generated client bundle and installed dependencies are excluded.

The reproducibility workspace is `/private/tmp/hci-team-audit-2026-10-31/`; it contains the source-copy rehearsal and temporary probe scripts. It is a local scratch workspace, not a portable release. The normal app browser suite was run without changing its assertions. One initial client-probe run waited for a native option to become visible; the probe selector was corrected, then the probes completed. No application fix was made to obtain those probe outcomes.

Initial build environment failures (external dependency symlink, font access/process restrictions) are not the final build result. The fresh-cache build succeeded. No restart, two-connection concurrency, human usability, real LAN device or physical display result is claimed.
