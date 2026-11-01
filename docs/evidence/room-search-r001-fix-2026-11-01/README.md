# SEARCH-R001 correction — 1 November 2026 (Europe/Berlin)

Finding: [SEARCH-R001](../../reviews/2026-11-01-room-search-review.md) by Codex (kept unchanged; Codex's evidence stays in [`room-search-review-2026-11-01/`](../room-search-review-2026-11-01/README.md)). Correction and checks by Claude Code for Ali in Ali's checkout (`main` at `452d893` plus the uncommitted room-search milestone). **Uncommitted**; nothing staged, committed, pushed, merged or deployed. Ali's demo database was not touched again (SHA-256 of the DB and sidecars, `data/` and `.env.local` identical before and after the checks).

## Cause

`RoomDirectory` read `?suche=`/`?datum=` only when mounting. A same-page navigation (Back/Forward, language switch, the bare "Räume" navigation link) keeps the component mounted, so the effect saw the incoming URL and wrote the older local state over it. The language links themselves were rendered on the server without the search, and only "kept" the search because of this overwrite.

## Fix

| File | Change |
| --- | --- |
| `src/components/public/RoomDirectory.tsx` | One effect owns URL ↔ state. URLs written by the page (`history.replaceState`) are queued until Next.js reports them back through `useSearchParams`; any other incoming URL is a navigation and replaces the local query/day instead of being overwritten. No navigation or reload per keystroke |
| `src/components/public/LiveLanguageSwitch.tsx` (new) | Client language switch that reads the listed query keys from the current URL, so DE/EN keeps the search as edited; no prefetch (target changes while typing) |
| `src/components/public/PublicShell.tsx`, `PublicNav.tsx` | Optional `liveParams` on the shell; optional `prefetch={false}` on `LanguageSwitch`. Other pages unchanged |
| `src/app/rooms/page.tsx` | `liveParams={["suche", "datum"]}` |
| `tests/e2e/room-search.spec.ts` | Three new tests appended; the existing six are unchanged |

## Regression tests

1. **Back/Forward across a language switch**: German `?suche=Chris&datum=2031-05-12` → English → Grosch / 2031-05-13 → Back (expects Chris / 12 May, German, two Zagel classes, URL stable after a pause) → Forward (Grosch / 13 May, English, honest empty state) → Deutsch after the edit (keeps Grosch / 13 May).
2. **Bare Rooms link** in German and English clears search and day (URL `/rooms` or `/rooms?lang=en`, empty field, full directory), and Back restores the filtered entry.
3. **Fast typing** (`delay: 0`) and ordinary typing keep every character, clear keeps focus, URL follows, and no page load or search-URL server request happens while typing. This preserves existing behaviour; it is not a reproduction of the finding.

The URL is checked once more without retrying after 700 ms, so a late rewrite is caught.

## Results (actual runs; logs in this folder, paths replaced)

| Run | Code | Result | Log |
| --- | --- | --- | --- |
| Room-search spec with tests 1–2 added | unfixed | exit 1: 6 existing passed; test 1 failed at the intended assertion (URL after Back was `?suche=Grosch&datum=2031-05-13`); test 2 failed in fixture setup (409, see note) | `1-before-fix-spec.log` |
| Test 2 alone | unfixed | exit 1: URL first `/rooms`, then rewritten to `?suche=Chris&datum=2031-05-12` (caught by the delayed check) | `2-before-fix-bare-link.log` |
| Room-search spec, 9 tests | fixed | exit 0, 9/9 | `3-after-fix-spec.log` |
| SEARCH-R001 tests, three separate runs with fresh DBs | fixed | 3/3 each | `4-stability-run-*.log` |
| `--repeat-each=5` in one run | fixed | first repetition 3/3; later repetitions fail in `beforeAll` with 409 because the fixed fixture slots already exist in the same DB (fixture limitation, not app behaviour) | `5-repeat-each-fixture-collision.log` |
| Mutation: echo queue removed (every URL change treated as navigation) | temporary edit, restored byte-identical | exit 1: fast-typing test fails (characters lost); tests 1–2 pass | `6-mutation-no-echo-queue.log` |

Full sequence after the fix (this checkout, temporary databases, run in order):

| Command | Exit | Count |
| --- | --- | --- |
| `npm run typecheck` | 0 | — |
| `npm run lint` | 0 | 0 problems |
| `npm test` | 0 | 152/152, 19 files |
| `npm run build` | 0 | — |
| `PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e` | 0 | 75/75 (72 + 3 new) |
| `bash scripts/verify-restart.sh` | 0 | PASS: 13 checks |

Suite screenshots went to a temporary folder; committed screenshots are unchanged. The new tests create fixtures with the admin API; traces, videos and screenshots are off in this spec. A credential-pattern scan of the logs found only long test-result folder names, no secrets.

**Note on the fixture:** after a failed test Playwright restarts the worker and `beforeAll` runs again in the same database; the fixed K1-120 slots then collide (409). This only affects runs that already have a failure (or `--repeat-each`). Not changed here to keep the scope to SEARCH-R001.

## Not covered

Human usability, physical screen, second device, office/staff search (T33 remainder), T34 corrections.
