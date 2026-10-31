# Versions

| Name | Commit | What it is | Evidence | Not established |
| --- | --- | --- | --- | --- |
| Original deliveries | `7326b8e` (Aryan V12.2), `1c566f3` (Aryan+Parsa joint), `6bc0b21` (Reza) | Teammates' work, imported unchanged | `docs/contributions.md`, source hashes 67/67 | Integrated behaviour |
| **integrated-v1** | code: `64d2801` (branch `integrate/team-v1-20261031`; docs-only commits follow) | Technical integration of all modules; CH-001…CH-011 | T17: typecheck 0, lint 0 problems, unit 134/134, build 0, E2E 60/60, concurrency 3/3, restart PASS 13 — `docs/evidence/integration-2026-10-31/T17/` | Human usability, physical screen, real campus accuracy, real timetable |
| V2 | — | Not started; will follow T23 findings | — | — |

## integrated-v1 reproduction

```bash
git checkout integrate/team-v1-20261031   # or the V1 commit above
npm install
npm run admin:set-password
export CAMPUS_BOARD_DB_PATH="$PWD/.demo-data/team-demo.sqlite"
npm run db:seed-team-demo -- --yes
npm run build && npm start               # http://localhost:3000
```

- Demo data: 48 catalog rooms `lcc-demo-room-<code>` (47 positioned, K1-114 without position, 21 initially reservable, all `isDemo`), 4 demo classes on "today"/"tomorrow" relative to the seed date. Source: `src/lib/map/team-catalog.ts`, `src/lib/map/team-seed.ts`.
- Booking policy assumptions: `docs/contracts.md` C4.
- V1 screenshots (simulated 540×960 and 1080×1920 portrait, plus earlier screenshot specs): `docs/evidence/integration-2026-10-31/screenshots/`. They must not be overwritten during V2; V2 screenshots go to a new folder.
