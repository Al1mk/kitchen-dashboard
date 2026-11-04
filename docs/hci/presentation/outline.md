# Five-minute demonstration outline (T27) — prepared, NOT REHEARSED

## Current V2 assignment — 3 November 2026

Ali requested **Aryan+Parsa build the PowerPoint, Reza is the main presenter**. Aryan is the primary editor of the deck; Parsa supplies before/after images/demo assets and checks technical accuracy; Reza writes/rehearses the spoken narrative; Ali verifies shared-system claims. The full [team task plan, section 7](../../plans/v2-team-2026-11-03/01-team-tasks-fa.md) proposes six slides in five minutes: problem → V1 → findings → V2 before/after → short user journey → actual validation/limits/contributions.

Target future files: `docs/hci/presentation/v2/LCC-Campus-Board-V1-V2.pptx` and a PDF backup. **Neither file has been created and no rehearsal is recorded.** PowerPoint is the team's chosen format, not a verified course requirement. V2 screenshots can only be added after implementation; drafts/mockups must be labelled. Each builder supplies their own change evidence to Reza; no invented test results or measured UX benefit. The earlier full-system demo outline below is retained as an alternative/history and is not the current speaking script.

## Earlier demonstration outline

Suggested timing (not mandatory speaking quotas):

| Time | Content | Live path (team demo DB) |
| --- | --- | --- |
| 0:00–0:30 | Problem, three user groups, prototype boundary (demo data, illustrations) | `/` |
| 0:30–2:00 | Find room → schedule → reserve → receipt → cancel | `/map` search "K1-120" → "Termine in diesem Raum" → "Auf der Karte" → "Diesen Raum reservieren" → receipt → `/booking/cancel` |
| 2:00–3:00 | Newcomer entry and DE/EN | `/newcomers?lang=en` |
| 3:00–4:00 | Katja: publish a notice; class conflicting with a booking → list → cancel → retry | `/admin/announcements`, `/admin/schedule/new`, `/admin/bookings` |
| 4:00–5:00 | What was evaluated and how; one or two changes; limits | change ledger + actual session records |

Setup: `CAMPUS_BOARD_DB_PATH=.demo-data/team-demo.sqlite npm run db:seed-team-demo -- --yes` then `npm run build && npm start`; never the real `data/` file. Backup: V1 screenshots in `docs/evidence/integration-2026-10-31/screenshots/` (simulated viewports, not a live demo). Actual rehearsal duration: NOT RECORDED.
