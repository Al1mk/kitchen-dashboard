# M0/M1 Implementation plan — LCC Campus Board

Scope: M0 preparation and M1 (announcement draft → preview → publish → public display → edit/republish → withdraw). Nothing beyond M1 is built in this run.

## Stack (actual, pinned via package-lock.json)

| Concern | Choice | Reason |
| --- | --- | --- |
| Framework | Next.js 16.4.3 (App Router), React 19.3, TypeScript 5.9 | Master-prompt default; one server for admin, display and API. `cacheComponents` disabled: all admin/public data is request-time, freshness matters more than prerendering. |
| Runtime | Node.js 22.20 (local) | Installed LTS; supports type stripping for the small CLI scripts. |
| Styling | Tailwind CSS 4 + CSS custom properties as semantic tokens | Scaffold default; tokens in `src/app/globals.css`, documented in `DESIGN.md`. |
| Validation | zod 4.6 | Maintained schema library, server-side validation. |
| Persistence | SQLite via better-sqlite3 13 (file on disk) | Shared persistent store for laptop and display; versioned migrations via `PRAGMA user_version`. |
| Auth | Single demo admin from `.env.local`; scrypt (node:crypto) password hash; random 256-bit session tokens stored as SHA-256 hashes in SQLite; HttpOnly SameSite=Lax cookie; Origin check on every mutation | Established primitives, no homemade crypto; server-validated, revocable sessions. |
| Tests | Vitest 5 (unit/integration), Playwright 1.64 (E2E, Chromium) | Test-first for domain/policy; E2E with independent browser contexts. |

## File responsibility map

| File | Responsibility |
| --- | --- |
| `src/lib/config.ts` | Reads environment (DB path, credentials, cookie security). |
| `src/lib/db/database.ts` | Opens SQLite, applies migrations, process-wide singleton. |
| `src/lib/db/migrations.ts` | Ordered SQL migrations. |
| `src/lib/time/berlin.ts` | Europe/Berlin ⇄ UTC conversion and German formatting. |
| `src/lib/announcements/schema.ts` | Shared contract: categories, limits, zod input schema (reusable by teammates). |
| `src/lib/announcements/policy.ts` | Pure rules: public visibility window, pending changes, admin status. |
| `src/lib/announcements/projection.ts` | Allowlisted public projection. |
| `src/lib/announcements/repository.ts` | All announcement reads/writes (create, save draft, publish, withdraw, list, listPublic). |
| `src/lib/auth/password.ts` | scrypt hash/verify. |
| `src/lib/auth/sessions.ts` | Session create/validate/delete in SQLite. |
| `src/lib/auth/request.ts` | Next-specific: session from cookie, `requireAdmin` (pages), `requireAdminApi` (API), cookie options. |
| `src/lib/http/origin.ts` | Same-origin check for state-changing requests. |
| `src/app/api/auth/{login,logout}/route.ts` | Login/logout. |
| `src/app/api/admin/announcements/**` | Admin write/read contract (auth + origin protected). |
| `src/app/api/public/announcements/route.ts` | Public read-only contract (`no-store`). |
| `src/app/admin/login/page.tsx` | Login UI. |
| `src/app/admin/(protected)/**` | Overview, list, new, edit, preview pages. |
| `src/app/display/page.tsx` | Public portrait kiosk. |
| `src/components/display/BoardLayout.tsx` | Presentational portrait board (used by display and admin preview). |
| `src/components/display/DisplayBoard.tsx` | Client polling, loading/empty/stale/error states. |
| `src/components/admin/AnnouncementEditor.tsx` | Form, live preview, save/publish/withdraw, unsaved-change guard. |
| `scripts/set-admin-password.ts` | Writes username + password hash to `.env.local` (never prints the password). |
| `scripts/seed-demo.ts` | Opt-in, idempotent, labelled demo content. |
| `tests/unit/*` | Policy, schema/time, repository/persistence, auth. |
| `tests/e2e/*` | Auth, API security, publish flow in two contexts, display states, screenshots. |

## Checklist

### M0
- [x] Inventory `Project/`: only `Handoff/`, `CLAUDE.md`, `AGENTS.md`; no existing app or team code.
- [x] Read vault notes HCI-00…HCI-09.
- [x] Stack selected and installed; Git initialised only in `campus-board/`.
- [x] File map and test plan (this file).
- [x] Record ADR-007/008 in vault.

### M1 (test-first where marked T)
- [x] T Policy: draft/withdrawn/future/expired excluded; published visible; pending changes detected.
- [x] T Schema/time: required fields, lengths, enum, end after start, Berlin DST conversion.
- [x] T Repository: create idempotency, draft edits do not change published snapshot, withdraw removes public, data survives reopen.
- [x] T Auth: hash/verify, session expiry, logout invalidation.
- [x] API routes (admin + public) with auth/origin checks.
- [x] Admin UI: login, overview, list, editor with live preview, preview page, publish/withdraw with feedback and confirmation, unsaved-change guard.
- [x] Display UI: polling every 5 s, loading/empty/stale/error/recovery states.
- [x] E2E: unauthorized direct requests, invalid input, two-context publish/edit/republish/withdraw, display states, screenshots (1440×900 admin, 1080×1920 simulated portrait).
- [x] Restart persistence verified against a real server restart.
- [x] Typecheck, lint, unit tests, E2E, production build — results recorded in `docs/evidence/`.
- [x] README, DESIGN.md, vault notes updated.

## Deviations and notes (2026-10-24)

- `cacheComponents` (scaffold default) turned off; `package.json` is `"type": "module"`; `tsconfig` allows `.ts` import extensions so the same modules run in Next, Vitest and plain Node scripts.
- `@types/node` pinned to 22 (Vitest 5 peer range; matches runtime).
- Sessions persist in SQLite, so a server restart does not log the admin out (verified). Expiry 8 h.
- Bugs found by tests and fixed: duplicate `id` on two confirm dialogs (broke dialog labelling), redundant `aria-label` on preview cards, password script relied on private readline internals and lost piped input.

## Targeted fixes after the independent M1 review (2026-10-25)

Findings R-001…R-004 from the review note `HCI-10 M1 review` (Obsidian vault). Scope stayed M1: no new modules, no redesign, no credential or data changes. Each regression test was run against the unfixed code first and failed.

| ID | Problem | Fix | Regression check |
| --- | --- | --- | --- |
| R-001 | Several long cards shrank inside the fixed-height list and clipped their text (`overflow-hidden`) | `shrink-0` on the card in `BoardLayout.tsx`; the list scrolls instead | `tests/e2e/display-overflow.spec.ts`: 3 published + 1 draft at max length; on `/display` (1080×1920) and in the admin preview: 0 clipped cards, list scrollable, last card reachable. Before the fix: 3 of 3 cards clipped. |
| R-002 | Editor crashed on plain HTTP via a non-loopback host (no secure context → no `crypto.randomUUID`) | Request id from `crypto.getRandomValues` (`AnnouncementEditor.tsx`) | `tests/e2e/insecure-origin.spec.ts`: Chromium maps `campus-board.test` to 127.0.0.1; asserts `isSecureContext=false`, no `randomUUID`, then saves a draft without page errors. Before the fix: client error page. |
| R-003 | `db:seed-demo` ignored `.env.local`, could seed a different DB than the app | Script loads env via `@next/env` (now an explicit dev dependency, same version as `next`) and reuses `getDatabasePath()` | `tests/unit/seed-demo.test.ts`: temp dir with `.env.local` → seeds the custom path, default path untouched. Before the fix: wrote `data/campus-board.sqlite`. |
| R-004 | `verify-restart.sh` printed values but did not assert them | `set -euo pipefail`, HTTP status checks, exact before/after comparison, port-in-use and stop checks, cleanup trap, no secrets in messages | Real run: `PASS: 5 checks`. Three negative variants (deleted DB, wrong password, port in use) each exit 1: `docs/evidence/logs/2026-10-25-restart-negative-checks.txt`. |

Limits: R-001 makes all content reachable by scrolling, but a public screen without touch input has no one to scroll it; how to present more content than fits (rotation/paging, length limits) is a design question for later, not solved here. R-002 is verified in an isolated browser on one machine, not on a real LAN with a second device.
