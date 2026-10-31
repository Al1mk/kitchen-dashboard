# Five-minute demonstration outline (T27) — prepared, NOT REHEARSED

Suggested timing (not mandatory speaking quotas):

| Time | Content | Live path (team demo DB) |
| --- | --- | --- |
| 0:00–0:30 | Problem, three user groups, prototype boundary (demo data, illustrations) | `/` |
| 0:30–2:00 | Find room → schedule → reserve → receipt → cancel | `/map` search "K1-120" → "Termine in diesem Raum" → "Auf der Karte" → "Diesen Raum reservieren" → receipt → `/booking/cancel` |
| 2:00–3:00 | Newcomer entry and DE/EN | `/newcomers?lang=en` |
| 3:00–4:00 | Katja: publish a notice; class conflicting with a booking → list → cancel → retry | `/admin/announcements`, `/admin/schedule/new`, `/admin/bookings` |
| 4:00–5:00 | What was evaluated and how; one or two changes; limits | change ledger + actual session records |

Setup: `CAMPUS_BOARD_DB_PATH=.demo-data/team-demo.sqlite npm run db:seed-team-demo -- --yes` then `npm run build && npm start`; never the real `data/` file. Backup: V1 screenshots in `docs/evidence/integration-2026-10-31/screenshots/` (simulated viewports, not a live demo). Actual rehearsal duration: NOT RECORDED.
