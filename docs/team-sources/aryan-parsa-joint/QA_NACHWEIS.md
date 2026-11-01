# QA report — Parsa Raumbuchung + Aryan LCC Navigator, 30 October 2026

## Inputs
- `LCC_K1_COMPLETE_V12_2_QA_VERIFIED.zip` (Aryan map, 47 room codes across three floor illustration assets).
- `Parsa_Raumbuchung_Final_Fuer_Ali.zip` (Parsa booking implementation candidate).
- Ali repository `Al1mk/kitchen-dashboard`, `main` commit `4ae9808edec4348f116d2d536c84eb05af151e27` reviewed for relevant paths on 30 October 2026. No direct repository writes performed.

## Tested (local, automated)
1. `node --check` of combined map `app.js` and `data.js`: passed.
2. `python -m py_compile` of combined Next.js installer: passed.
3. Headless Chromium with self-contained HTML/CSS/JS (localhost navigation is blocked in this sandbox):
   - All 47 room codes locate the right floor and selected room, with **exactly four** showing a booking action; passed.
   - Click simulated map search for `K1-120`: booking CTA correctly contains `?raum=K1-120`; passed.
   - Landing on booking with that query preselects K1-120 and uses Aryan 1OG image path; passed.
   - Booking back link handler selects the current room in the map query; static syntax reviewed.
   - EN map deep link `?raum=K1-303&lang=en` selects floor 3 and renders English booking CTA; passed.
   - Non-bookable `K1-107` does not expose booking CTA; passed.
   - Booking demo: date/slot, review, confirmation with receipt; passed.
   - Booking demo: occupied slot is disabled, bad cancellation token is rejected, correct cancellation frees slot; passed.
   - JavaScript page errors observed: none in these checks.
4. Combined installer dry-run and real file-copy/patch flow passed against a **synthetic repository fixture**, including creation of `/map`, `/booking`, map assets and the combined navigation. This is **not** a real Ali checkout test.
5. Four selected demo codes exist exactly once in Aryan's 47-room data file and have correct 1OG/2OG/3OG floors; passed.

## Not tested / critical limitations
- **Not a live public Netlify deployment test.** Browser network navigation to `http://127.0.0.1` was restricted; tests used inline scripts. Test the published URL manually.
- **Not a successful Next.js build or TypeScript/typecheck in Ali's actual repository.** Network checkout and npm dependencies were unavailable in this environment. Ali must install in a feature branch and run typecheck, lint, tests, build and e2e, and inspect Git diff.
- **Static booking demo uses localStorage** (browser-local, not shared); the Next.js code uses SQLite and server-side conflict checks only after installation.
- **No confirmed university booking permission or official floorplan accuracy**; four demo room statuses are assumptions. Aryan's PNGs are AI-generated illustrations, not official architectural or emergency plans.
- Anonymous public booking writes require deployment risk assessment. No production access-control/rate-limiting guarantees, no real university data integration, no human-user usability results.
- Static booking HTML currently has German UI; the Next.js booking UI supports German and English. The map UI supports German and English. Consider translating static booking if it becomes a requirement.

## Paths and deployment
- `01_NETLIFY_DEMO/index.html`: Aryan map; linked to `01_NETLIFY_DEMO/booking/index.html`.
- `02_FUER_ALI_NEXTJS/INSTALL_COMBINED.py`: guarded installer for Ali's feature branch.
- `02_FUER_ALI_NEXTJS/README_FOR_ALI.md`: technical transfer notes and review steps.
