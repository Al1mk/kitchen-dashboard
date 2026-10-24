# LCC Campus Board — Prototyp (M1: Mitteilungen)

Course prototype for *Mensch-Maschine-Interaktion*, Wirtschaftsinformatik 2.0, Hochschule Coburg (Lucas-Cranach-Campus Kronach). Not an official university system.

Two interfaces, one shared persistent data store:

| Route | Who | What |
| --- | --- | --- |
| `/admin/login`, `/admin/**` | Content administrator (laptop) | Login, overview, list, create/edit, portrait preview, publish, withdraw |
| `/display` | Public portrait screen | Read-only board, refreshes every 5 s, no admin navigation or session |
| `/api/public/announcements` | Anyone | Read-only, allowlisted projection of currently visible announcements |
| `/api/admin/**` | Logged-in admin only | Write contract (session + same-origin check on every mutation) |

Milestone status: **M1 only** (announcement draft → preview → publish → display → edit/republish → withdraw). Rooms, schedules, booking and newcomer content are not built.

## Requirements

- Node.js ≥ 22.18 (tested with 22.20 on macOS arm64)
- npm (lockfile: `package-lock.json`)

## Setup

```bash
npm install
npm run admin:set-password     # asks for username + password, writes .env.local (hash only)
npm run db:seed-demo           # optional: 3 clearly labelled demo items, idempotent, never deletes
```

The seed script loads `.env*` files the same way Next.js does (via `@next/env`), so it writes to the same database as `npm run dev`, including a `CAMPUS_BOARD_DB_PATH` set only in `.env.local`. It prints the database path it used.

`.env.local` is git-ignored and holds `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (scrypt). The password itself is never stored or printed. Without these values the login page shows a setup hint and login is disabled. See `.env.example` for all variables.

## Run

```bash
npm run dev                    # development, http://localhost:3000
# or production:
npm run build && npm start
```

- Admin: <http://localhost:3000/admin/login>
- Public display: <http://localhost:3000/display> (best in a portrait window or full-screen on the screen's browser)

### Data

SQLite file at `data/campus-board.sqlite` (override with `CAMPUS_BOARD_DB_PATH`). Created on first start, migrated automatically (`PRAGMA user_version`), **never reset**. To start over, stop the server and delete the file yourself. Back it up by copying the file while the server is stopped.

Local SQLite is not durable on serverless/ephemeral hosting; hosting is an open decision.

### Second device on the same network (not yet tested on real devices)

`next start` listens on all interfaces. On a network that allows client-to-client traffic, another device can open `http://<host-ip>:3000/display`. Find the host IP on macOS with `ipconfig getifaddr en0`. The macOS firewall may ask to allow incoming connections; nothing is changed automatically. Whether the campus network allows this is unknown.

Open the **admin on the host itself via `localhost`**: in production the session cookie is `Secure`, which browsers accept on `localhost` but not on plain-HTTP IP addresses. Only for a LAN demo where the admin must use the IP, set `CAMPUS_BOARD_INSECURE_COOKIES=true` (documented risk: cookie travels unencrypted). The editor does not depend on browser APIs that need HTTPS (such as `crypto.randomUUID`), so it also works on such a plain-HTTP address; this is covered by an isolated browser test with a mapped host name on one machine (`tests/e2e/insecure-origin.spec.ts`), not by a test on a real second device.

## Tests

```bash
npm run typecheck              # next typegen + tsc
npm run lint
npm test                       # Vitest: policy, schema/time, repository/persistence, auth, seed config (38 tests)
npm run test:e2e               # Playwright: builds, starts on :3100 with a temp DB and random password (19 tests)
scripts/verify-restart.sh      # publishes, restarts the production server, asserts data + session; exits 1 on failure (needs a prior build)
```

E2E uses two independent browser contexts on one machine (admin + display). That is not a two-device test. Display network failures are simulated by request interception. Screenshots are written to `docs/evidence/screenshots/` (1080×1920 is a simulated portrait viewport, not the measured screen).

## Security model (prototype)

- One demo administrator from environment; scrypt hash; server-side sessions (random 256-bit token in an HttpOnly, SameSite=Lax cookie; only its SHA-256 stored), 8 h expiry, logout deletes the session.
- Every admin page and API checks the session on the server; every mutation also requires a matching `Origin` header (CSRF defence).
- Public API returns only allowlisted fields of published announcements inside their window, evaluated with the server clock; `Cache-Control: no-store`.
- Plain text only (React escapes output; no HTML rendering).
- **Not covered:** login rate limiting, multiple accounts/roles, audit log, device/network lock-down. Anyone who can reach the server can open `/admin/login`; a public kiosk browser is not locked down by this app.

## Documents

- `docs/implementation-plan.md` — file map and checklist
- `docs/contracts.md` — shared data contract for teammates
- `DESIGN.md` — provisional design tokens
- `docs/evidence/` — test logs and screenshots
