# Room search (T32) and classroom search (T33 part) — 1 November 2026 (Europe/Berlin)

Implemented and checked by Claude Code for Ali in Ali's checkout on `main` at `452d893` (Node v22.20.0). The changes are **uncommitted** for Ali's review; nothing was pushed, merged or deployed. These are automated technical checks, not a usability study: no participant, observation or measured UX improvement is claimed.

## What changed

| File | Change |
| --- | --- |
| `src/lib/search/match.ts` (new) | Shared matcher: normalization (case, accents, `ß`, umlauts as `ae/oe/ue`, punctuation/whitespace), room match by code/DE/EN name and exact code with/without `K1-`, session match by course/lecturer, approved aliases `Chris`, `MMI`, `HCI` |
| `src/components/public/CampusMap.tsx` | Uses the shared matcher instead of its inline copy (Aryan's rules preserved; a punctuation-only query now matches nothing instead of every room) |
| `src/components/public/RoomDirectory.tsx` | Search field, clear, no-results, matching rooms by floor; class results for a chosen day with links by room ID and date; `?suche=`/`?datum=` mirrored to the URL |
| `src/app/rooms/page.tsx` | Comment on the new URL parameters |
| `src/lib/map/team-seed.ts`, `scripts/seed-demo.ts` | `HCI_LECTURER = "Prof. Dr. Christian Zagel"` on the three HCI demo sessions only |
| `tests/unit/search-match.test.ts` (new), `tests/unit/team-demo.test.ts`, `tests/unit/seed-demo.test.ts` | 13 + 2 + 1 new unit tests |
| `tests/e2e/room-search.spec.ts` (new) | 6 browser tests with fixtures on fixed dates in 2031 (created via the admin API, traces/videos/screenshots off) |

## Results (sequential, this checkout, temporary databases; logs in this folder, paths replaced by `<repo>`, `<scratch>`, `<tmp>`)

| Command | Exit | Count | Log |
| --- | --- | --- | --- |
| `npm run typecheck` | 0 | — | `typecheck.log` |
| `npm run lint` | 0 | 0 problems | `lint.log` |
| `npm test` | 0 | 152/152 in 19 files (was 136 in 18) | `unit.log` |
| `npm run build` | 0 | — | `build.log` |
| `PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e` | 0 | 72/72 (was 66) | `e2e.log` |
| `bash scripts/verify-restart.sh` | 0 | PASS: 13 checks | `restart.log` |

Screenshots produced by the browser suite went to a temporary folder (`SCREENSHOT_DIR`); committed screenshots are unchanged. Ali's `data/` files: SHA-256 identical before and after; `.env.local` unchanged. A credential-pattern scan of all logs here (long base64url strings, `Bearer`, password hash/variable names, cancel tokens) found no matches.

Before the full run, the focused new tests were run alone (6/6 browser, 13/13 + 14/14 unit). One test expectation was corrected during writing (a partial-code query also lists a longer code with the same prefix — intended behaviour, assertion was too strict). A mutation check of the stale-day test was done on a temporary edit of `usePolledJson.ts` (restored, `git diff` empty): removing the `stopped` guard made the test fail; removing every guard made the old day's response appear and disappear quickly enough that the test still passed, so the test detects the realistic regression but is not exhaustive.

## Ali's manual demo database

Target only: `.demo-data/ali-manual-2026-11-01.sqlite` (not used by any automated test). No server had it open.

1. Online SQLite backup to `.demo-data/backups/ali-manual-2026-11-01.before-hci-lecturer-20261101-124915.sqlite`; `integrity_check` ok, table row counts and all `class_sessions` rows equal to the source.
2. One-off guarded update in one immediate transaction: rows by known seed id pattern **and** `is_demo = 1`, exact HCI title, original room, old placeholder lecturer (`Dozent:in D (Demo)` base seed, `Dozent:in A (Demo)` team seed) and `created_at = updated_at` (never edited). Updated: `demo-session-2026-10-27-4`, `demo-session-2026-10-29-7`, `lcc-demo-session-2026-11-01-1`. Skipped: none. Other Mensch-Maschine-Interaktion rows not covered: none. Log: `demo-db-update.log`.
3. Full SQL dump before/after: only `instructor` and `updated_at` of those three rows differ (`demo-db-dump.diff`).
4. Verified through the app: production build on a temporary port 3300 with this DB, `/api/public/schedule` per day (`demo-db-api-check.txt`) and a read-only browser check of `/rooms` search → map → language switch (`demo-db-ui-check.log`, screenshots `rooms-search-chris-de.png`, `rooms-search-zagel-en.png`). The first map read in that log was taken before the room list loaded; a re-check after load shows K1-120 selected and its marker pressed. Server stopped afterwards; the DB is not open.

No seed was rerun and no general migration was added. Restore, if ever needed: stop the server, then copy the backup file over the demo DB file and remove that DB's `-wal`/`-shm` sidecars.

## Not covered

Office/staff search (Grosch, Katja), T34 room/label corrections, the kitchen rename, physical screen, second device, human usability. The demo sessions are not the course's real timetable.
