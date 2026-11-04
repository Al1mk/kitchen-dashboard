# Campus Board — setup, accounts and test guide

For Ali, teammates and anyone running the integrated prototype locally. Prepared **1 November 2026** from the current scripts and configuration. Commands below use **macOS/Linux shell syntax**; macOS with Node 22.20 is the previously tested environment. A fresh reader following this whole guide has **not** been observed yet (task T31).

## Choose your starting point

- **New clone:** follow first setup below.
- **Already installed and built:** use [restart an existing installation](#restart-an-existing-installation).
- **Need a username or forgot the password:** use [local administrator account](#local-administrator-account).
- **App opens but you need to check features:** use [manual walkthrough](#manual-walkthrough).
- **Startup fails:** use [troubleshooting](#troubleshooting).

## First setup from GitHub

Install Git, npm and Node.js **22.18 or newer** (Node 22.20 is the tested baseline). Check them without changing project files:

```bash
git --version
node --version
npm --version
```

Clone and install the versions in the lockfile:

```bash
git clone https://github.com/Al1mk/kitchen-dashboard.git
cd kitchen-dashboard
npm ci
```

If the folder already exists, use it instead of cloning over it. Run commands from the folder containing `package.json`. This project uses SQLite on the host: no separate database server, Docker, university account or paid API key is needed. Installation and the initial build need internet access (dependencies and Google fonts).

### Local administrator account

On a new installation, configure the local administrator interactively:

```bash
npm run admin:set-password
```

Enter a username (3–40 characters: letters, numbers, `.`, `_`, `-`) and a password of at least **12 characters**, then repeat the password. Password typing is hidden. Store your chosen credentials privately. The script writes the username and a password **hash** to ignored `.env.local`; it preserves other settings there. There is no default password.

**This configures/replaces the one administrator on this installation.** It does not add a second account. Each teammate's own clone can have its own local credentials. Students and visitors need no account; there is no sign-up page, student-user creation or multi-admin management. Katja uses `/admin/login` on her laptop; the public navigation has no admin link.

For a forgotten password or a deliberate username change, stop the server and run the same command, then start it again. Do not rerun it during ordinary restarts. Do not copy credentials into Git, screenshots, issue reports or chat. If an old login remains active after a reset, log out and log back in; the script changes credentials, not the stored session records.

### Select and prepare a disposable demo database

Use a separate file for manual tests so the normal `data/` database is not modified:

```bash
export CAMPUS_BOARD_DB_PATH="$PWD/.demo-data/team-demo.sqlite"
npm run db:seed-demo
npm run db:seed-team-demo -- --yes
```

Keep the **same terminal** for the following build and start. The exported setting is inherited by each command. Seed output prints the selected database path: check that it is the demo path you intended.

On a fresh file, the base seed supplies 3 notices (2 published, 1 draft), 6 `DEMO-` rooms and 9 weekday sessions for the current Berlin week. The team seed adds 48 map rooms (21 initially bookable) and up to 4 sessions for today/tomorrow. These are labelled examples, not a verified campus timetable or building plan. An unchanged fresh example has 54 rooms; edits, archival and collisions can change that result.

The seeds add missing examples and preserve existing records; `0 neu` / `bereits vorhanden` is normal on repeat. They do not undo your edits, restore archived rooms or clear bookings. Run setup seeds **before** a manual test with the server stopped. If you need a clean rehearsal later, choose a new demo filename and seed that file instead of reseeding a database containing your test work. Team seeding requires both the exported path and `--yes`, and refuses paths inside `data/`.

### Build and start

```bash
npm run build
npm start -- --hostname 127.0.0.1
```

Wait for **Ready**, keep the terminal open and open <http://localhost:3000/>. A successful build alone does not mean a server is running. Use another browser tab for <http://localhost:3000/admin/login>. Use one hostname consistently while logged in; `localhost` and a numeric IP do not share login cookies.

Stop with **Ctrl+C** in this server's terminal. Do not start a second server on the same port or build while this one is serving from the same checkout.

## Restart an existing installation

No reinstall, password reset or seed is needed for an ordinary restart. In Ali's current checkout and manual demo:

```bash
cd "/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/campus-board"
export CAMPUS_BOARD_DB_PATH="$PWD/.demo-data/ali-manual-2026-11-01.sqlite"
npm start -- --hostname 127.0.0.1
```

This code change needs one rebuild before that start (stop the server first, then `npm run build`). Ali's manual demo DB already has Prof. Dr. Christian Zagel as lecturer of its untouched HCI demo sessions (one-off update on 1 November with a backup in `.demo-data/backups/`); no seed run is needed for that.

Teammates use their own checkout path and the filename they selected, such as `.demo-data/team-demo.sqlite`. **Every new terminal needs the same export again.** Without it, the app defaults to `data/campus-board.sqlite`, which may contain different or no data. `.env.local` can alternatively hold the chosen `CAMPUS_BOARD_DB_PATH`, but an exported shell value takes precedence; keep one deliberate choice.

Rebuild after pulling code changes or before a first production start. Stop the server first; run `npm ci` if dependencies changed (or to reproduce the lockfile), then `npm run build` and the start command. Inspect local changes before pulling; do not reset or overwrite a teammate's work. For development, stop production, select the demo DB and use `npm run dev -- --hostname 127.0.0.1` instead.

## Pages and what they do

| Address on localhost:3000 | Purpose |
| --- | --- |
| `/` / `/?lang=en` | Public entry, German / English |
| `/newcomers` | Newcomer tasks and links; verified contacts still pending |
| `/map` | Illustrative floor map, search, room details and linked schedule/booking |
| `/rooms` | Active rooms and links to their map, schedule and booking; search by room number/name, and by course or lecturer for a chosen day |
| `/schedule` | Day's classes, room filter, previous/next day, cancelled classes |
| `/booking` / `/booking/cancel` | Demo reservation and cancellation without a student account |
| `/display` / `/display?lang=en` | Portrait announcement board |
| `/admin/login` / `/admin` | Local admin sign-in and overview (German) |
| `/admin/announcements` | Draft, DE/EN preview, publish/republish and withdraw |
| `/admin/rooms` | Create/edit, English fields, booking permission, archive/restore |
| `/admin/schedule` | Create/edit, cancel and reinstate classes |
| `/admin/bookings` | View and deliberately cancel demo bookings |

Use the public language switch to keep the selected day/room in links. English room/notice text appears when entered; missing translations have a German fallback marker. Class titles, lecturers and study groups stay as entered. Saved room/class edits become public immediately; notice drafts remain private until published. Public content normally refreshes within about 5 seconds.

## Manual walkthrough

Use a demo DB and separate public/admin browser tabs. These are **expected checks, not recorded passes**. Ali's internal check, an independent participant session and a physical-screen test must be recorded separately.

| Step | Action | Check |
| --- | --- | --- |
| 1 | From Start, visit every public section, return Home, switch DE/EN and continue | Shared navigation and language persist; no admin link |
| 2 | Search for `K1-120` on the map, view its schedule, choose tomorrow | Selected room/day remain correct; floor change clears the previous selection |
| 2a | On `/rooms`, search `K1 120`, then `seminar`; clear the search. Then search `Chris` (or `HCI`) and choose a day that has an HCI demo class | Room results keep floor grouping and links; class results show time, lecturer, room and "Entfällt" where cancelled; "Auf der Karte zeigen" opens the same room and day; language switch keeps query and day |
| 3 | Find essential information through Newcomer | Links work in both languages; note missing factual content separately |
| 4 | Choose a bookable room and a free hour tomorrow; confirm once | Matching room/date/time and confirmation; save your booking number/code privately before the 60-second receipt expires; try More time and Done |
| 5 | Cancel that reservation using its number and code | Clear cancelled result; slot becomes available; no login needed |
| 6 | In admin, create a room with a unique test code; add tomorrow's class there | Room appears in `/rooms`, class on tomorrow's `/schedule` |
| 7 | Rename that room, then cancel the class | Class stays attached to the same room; public schedule says `Entfällt` / `Cancelled` |
| 8 | Edit a mapped demo room's floor, then restore it deliberately | Old position is not displayed on the wrong floor; a new room has no automatic map position |
| 9 | Create a DE/EN notice, save draft, preview both views, publish, edit draft, republish, withdraw | Draft private; published snapshot visible; unpublished edits private; withdrawal removes both languages |
| 10 | Book a free future slot; try creating/editing a class at that time in admin | Explicit conflict, no silent cancellation; Katja can deliberately cancel the booking and retry |
| 11 | Stop and restart using the same DB, revisit data and log in as needed | Saved data remains; this does not recover a lost memory-only receipt |

Booking limits are prototype assumptions: Berlin dates, today through the next 13 days, 08:00–20:00, 15-minute steps and 15–120-minute duration. Use a future slot within the displayed availability, rather than assuming a fixed example time is free. For an uncertain booking response use the offered retry; reloading/closing can lose the memory-only cancellation details. Katja's booking list is available for deliberate demo cleanup.

After testing, cancel your test bookings, withdraw test notices and cancel test classes as appropriate. Archive a test room only after resolving future occupancy; do not delete the shared database to clean one test. Keep known demo labels and record deliberate edits that affect a later rehearsal.

### Record a problem or a user session

Record commit/version, page URL, language, device/browser/viewport, steps, expected vs actual result and whether it repeats. Include a screenshot only after masking credentials, cancellation codes and personal data. Record success, help and duration only when actually observed/measured.

The shared participant plan is [U1–U6](hci/testing/plan.md); templates are under [HCI documentation](hci/). Do not count automated browser runs, load requests or simulated personas as human participants. V2 changes need a traceable finding → change → before/after → actual retest or an explicit NOT RUN.

## Another device or the campus screen

This is an optional LAN test, **not yet confirmed on physical devices**. Stop the localhost-only server and start the same production build/DB with:

```bash
npm start -- --hostname 0.0.0.0
```

On macOS, `ipconfig getifaddr en0` often gives the Wi-Fi address; if empty, check the active interface in network settings. On the same network, open `http://<host-ip>:3000/` on the other device. `localhost` there means that other device, not Ali's Mac. Campus Wi-Fi may isolate devices; check firewall/network access if the host works but the device cannot connect. No public tunnel or deployment is required for this test.

Katja on the host should keep using `http://localhost:3000/admin/login`. For an admin on a **second laptop over plain HTTP**, production cookies require the explicit local-demo setting `CAMPUS_BOARD_INSECURE_COOKIES=true` in ignored `.env.local`, followed by restart. That weakens cookie transport protection: use only a trusted demo network, never share real credentials, and remove it after testing. Do not enable it merely to fix public pages. HTTPS hosting is separate work.

If `next dev` reports a blocked origin for its development resources over an IP, use the production build/start path above. Do not disable origin checks blindly. Read the actual model/resolution/orientation/touch behaviour from the screen; 1080×1920 in browser tests is an assumption, not a measurement. Record device/network results for T20.

## Data and backup

- Credentials are in ignored `.env.local`; content, sessions and bookings are in the selected SQLite file. Git contains neither. Another clone does not receive local content or credentials.
- Stop the app and any other users of that database before copying a backup. Preserve the selected database directory, including any SQLite sidecar files; do not copy only the main file while writes are active. Keep credential backups private too.
- For a clean demo, select a new `.demo-data/` filename and run setup seeds before starting. Existing DBs and edits remain untouched. Never delete the normal `data/` directory as a troubleshooting shortcut.
- Migrations run automatically; a database upgrade is not a reset. Back up valued data before updating code.

## Automated checks for contributors

These are functional/persistence checks, not a human UX study. Stop the manual/dev server first: tests/builds share `.next` in this checkout. On the first browser-test setup:

```bash
npx playwright install chromium
```

Then:

```bash
npm run typecheck
npm run lint
npm test
PLAYWRIGHT_NO_COPY_PROMPT=1 npm run test:e2e
bash scripts/verify-restart.sh
```

The browser configuration builds production output, uses a temporary DB/random admin and starts on port **3100**. Restart verification needs that production build (or a prior `npm run build`), uses its own temporary DB and port **3200**. Keep those ports free. Do not override `E2E_DB_PATH` with valued data. Tests produce ignored `test-results/` and `playwright-report/`; inspect/redact artifacts before sharing because failure snapshots can include page content. Credential-bearing tests disable traces/video/screenshots; the command above also disables automatic error-context copying.

The latest recorded run (SEARCH-R001 correction, 1 November, this checkout) had **152 unit and 75 browser tests plus 13 restart checks**; see [logs and scope](evidence/room-search-r001-fix-2026-11-01/README.md). The room-search run before it had 152/72/13 ([logs](evidence/room-search-2026-11-01/README.md)). The earlier fresh-clone run had 136/66/13 ([logs](evidence/post-push-verification-2026-11-01/README.md)). These are historical results, not a promise of today's run. Stop at a failed command, investigate and record its real outcome. Once finished, restart the manual app with its own demo DB selected. No full suite needs repeating just because this documentation changed.

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| `EADDRINUSE` on port 3000 | Another server owns the port. Inspect with `lsof -nP -iTCP:3000 -sTCP:LISTEN`; stop your known server with Ctrl+C in its terminal. Do not kill every Node process. Alternatively start with `npm start -- --hostname 127.0.0.1 --port 3001` and open `http://localhost:3001/`. |
| Build succeeded, but no page opens | Start must also reach Ready and remain running. Check terminal errors and the actual port. A build does not launch the site. |
| No production build found | Stop any server, run `npm run build`, then start. Dev output alone is not a production build. |
| `npm` / `node` missing, or Node cannot run `.ts` scripts | Install/select the supported Node version; recheck `node --version`, then `npm ci`. |
| Native SQLite module mismatch after changing Node | Stop the server and rerun `npm ci` with the intended Node version. Retain the error if build tools/platform dependencies are missing. |
| Login disabled / unknown password | On this installation run the interactive account setup, restart, and use your chosen credentials at `/admin/login`. There is no public registration or default login. |
| Login keeps returning to login over a LAN IP | Check hostname consistency and the explicit plain-HTTP demo cookie option above; prefer localhost on the host. |
| Unexpected or empty content | Verify the exported DB path in this terminal. Do not assume the selected date has classes: base seed is weekdays, team seed today/tomorrow. A search for `Chris`/`HCI` finds HCI demo classes only on days that have one. Archived/edited seed rows are preserved. |
| Notices remain on Loading / old app state | Check the terminal and the public API at `/api/public/announcements`; reload the correct production address. If using LAN dev, use the production instructions. Preserve errors for investigation rather than treating HTTP 200 alone as interactive success. |
| New room has no map marker | Expected: rooms use stable IDs but positions are separately configured. A name/code match does not invent geometry. |
| Booking/class save refused | Check active/reservable room, date/time limits and existing occupancy. Resolve a real conflict explicitly; don't bypass the server checks. |
| Browser tests can't launch / server already exists | Install test Chromium and free port 3100; restart check uses 3200. Keep the manual server stopped while builds/tests run. |
| Build cannot download fonts | Check internet/proxy access. Fonts are imported through `next/font/google`; a fetch failure is not evidence that bookings or other features are broken. |

## Remaining guide tasks

- **T30 / K-8:** document setup, account provisioning, demo choice, restart, walkthrough, LAN, data, checks and troubleshooting; verify commands against source and links locally.
- **T31 / K-9:** a teammate follows the guide from a fresh clone, with their own private admin credentials; record platform/version, DB selection, Ready, login/public outcome and unclear steps. **WAITING_HUMAN.**
- Physical screen/device checks (T20), actual participant sessions (T22), V2/retest and booklet remain separate tasks. This guide does not mark them complete.

Task-state authority: [integration progress](plans/team-integration-2026-10-31/02-progress.md). User-facing overview: [README Kanban](../README.md#kanban-board-no-deadlines).

## V2 integration walkthrough (4 November 2026)

Use a **new disposable demo file** to keep earlier manual observations and bookings intact. Stop any server using this checkout before rebuilding its `.next` directory. The example uses port3001 to avoid an unrelated server on3000; adjust the browser address accordingly. Existing local admin credentials still come from your private `.env.local`; do not reset or commit them.

```bash
cd "/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/campus-board"
export CAMPUS_BOARD_DB_PATH="$PWD/.demo-data/ali-v2-2026-11-04.sqlite"
npm run db:seed-demo
npm run db:seed-team-demo -- --yes
npm run build
npm start -- --hostname 127.0.0.1 --port 3001
```

Open `http://127.0.0.1:3001/`; admin is `http://127.0.0.1:3001/admin`. Seeding is idempotent: reusing an old file does not reset its existing dates/data. For current demo dates use a fresh filename or deliberately select an existing session’s date; do not mistake an empty day for a broken lecturer search.

1. Switch DE/EN, open Rooms, use the floor chips and search a room/course for the displayed date.
2. Open a reservable room’s schedule, choose a date inside the 14-day demo window and use the booking link. Room/day/language should carry over.
3. Choose a free slot, review, then confirm. On the temporary receipt, save both credentials privately; tick the acknowledgement to enable Done. More time extends it; a menu link asks before leaving, while the language switch keeps it.
4. To test self-cancellation, use the cancellation page with both values **before** discarding them. Check show/hide and the localized feedback. Do not post the code or screenshot it unmasked.
5. Verify a deliberately invalid room on Schedule gives an unavailable-room message and an All rooms return path, rather than presenting an ordinary connection outage.

These are manual test instructions, not a record that a person performed them. Touchscreen reach, native keyboard, real campus content and user comprehension are still unverified.
