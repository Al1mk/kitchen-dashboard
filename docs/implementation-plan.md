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

## M2: rooms and class sessions (2026-10-25)

Scope set by Ali: room management, class-session management, minimal public room directory and daily schedule, labelled demo data, contracts compatible with the teammates' future map. Not in scope: booking, newcomer pages, V2 redesign, deployment, Figma, rebuilding the map.

### File map

| File | Responsibility |
| --- | --- |
| `src/lib/db/migrations.ts` | Schema v2: `rooms`, `class_sessions` (FK `ON DELETE RESTRICT`, indexes) |
| `src/lib/time/berlin.ts` | + calendar dates, Berlin day bounds (23/24/25 h days), German date formats |
| `src/lib/validation.ts` | zod issues → German field errors (shared) |
| `src/lib/rooms/schema.ts` / `repository.ts` | Room contract, validation, CRUD, archive guard, public projection |
| `src/lib/sessions/schema.ts` / `repository.ts` | Session contract, Berlin date+time input → UTC, term helpers, overlap check, cancel/reinstate, public day query |
| `src/lib/http/schedule-errors.ts` | German error responses for room/session routes |
| `src/app/api/admin/rooms/**`, `src/app/api/admin/sessions/**` | Admin write API |
| `src/app/api/public/rooms`, `src/app/api/public/schedule` | Public read API |
| `src/app/admin/(protected)/rooms/**`, `.../schedule/**` | Admin pages |
| `src/components/admin/RoomForm.tsx`, `SessionForm.tsx`, `FormParts.tsx`, `adminFetch.ts`, `useUnsavedChangesGuard.ts` | Admin forms and shared form helpers |
| `src/components/public/**`, `src/app/rooms`, `src/app/schedule` | Public pages with polling (`usePolledJson`, same behaviour as ADR-011) |
| `src/lib/request-id.ts` | Request id for idempotent creates (moved out of the announcement editor, behaviour unchanged) |
| `scripts/seed-demo.ts` | + 6 `DEMO-` rooms and one demo week of sessions |

### Checklist

- [x] Unit tests written first and seen failing (missing modules/tables): rooms, sessions, Berlin days/terms, migration.
- [x] Additive migration; an M1 database upgrades in place (unit test + a copy of the real `data/` database; original untouched).
- [x] Rooms: stable id, unique code (case-insensitive), floor, type, description, reservable; edit keeps session references; archive blocked while sessions are planned; restore.
- [x] Sessions: server-side validation, Berlin time incl. DST, same-room overlap rejected, archived/unknown room rejected, cancel/reinstate (reinstate re-checks room).
- [x] Public directory and daily schedule read the same database; changes appear by polling without reload (E2E, two contexts).
- [x] Allowlisted public fields; anonymous and cross-origin writes rejected (E2E).
- [x] Restart check extended to rooms and schedule.
- [x] Labelled demo data (opt-in seed).
- [ ] Contract agreed with Arian/Parsa (only proposed; see `docs/contracts.md`, "Open / proposed").

### Deviations and notes

- No draft/publish for rooms and sessions (decision recorded in the vault, ADR-013): saves are public at once and every form says so.
- The admin overview now describes the panel's real purpose (rooms, schedule, announcements); announcement behaviour is unchanged.
- One E2E failure during development was a test selector (Next's route announcer also has `role="alert"`), not an app bug.
- Public pages use rem-based sizes (≥ 56 px targets), not the container-scaled layout of `/display`; on a 1080×1920 screen they use the middle 768 px. Kiosk sizing is a V2/display question.

## Public navigation and DE/EN (2026-10-25)

Scope set by Ali: a clear public entry, one navigation between announcements, rooms and schedule with an obvious return path, no admin links, German/English for the public interface, keeping language, day and room. Functional V1, not V2. Not in scope: map, booking, newcomer content.

| File | Responsibility |
| --- | --- |
| `src/lib/i18n/public.ts` | `Lang`, `parseLang`, `publicHref` (keeps `lang` + context), German/English interface text |
| `src/lib/time/berlin.ts` | Long/calendar dates and date-times optionally in English (en-GB); German stays the default |
| `src/components/public/PublicNav.tsx` | Shared navigation (Start, Mitteilungen, Räume, Stundenplan) and Deutsch/English switch, page and board sizes |
| `src/app/page.tsx` | Public start page (was a redirect to `/display`) |
| `src/app/display/page.tsx`, `src/components/display/*` | Board gets the navigation, language switch and English text; admin preview unchanged (no nav, German) |
| `src/components/public/*`, `src/app/rooms`, `src/app/schedule` | `lang` passed through; day/room/"all rooms" links keep context |

- [x] `/` is a real page; every public page links to Start, Mitteilungen, Räume, Stundenplan; no `/admin` links (E2E checks each page visited).
- [x] Language switch on every public page; `lang` kept on all public links; schedule keeps `datum`/`raum` on day, room and language changes (E2E, walked from `/` by clicking only).
- [x] Staff-entered text shown as entered with `lang="de"`; English mode says it is German.
- [ ] Optional English fields for staff content (not built; decision for Ali).
- [ ] Kiosk idle screen and automatic reset to start/German (team/V2).

Notes: the new E2E test was written after the code and passed on its first run; it was not run against the previous version. `<html lang>` stays `de`; the page container carries the language.

## Optional English content (2026-10-25)

Scope set by Ali after reviewing the navigation/DE-EN milestone: optional English title/body for announcements and name/description for rooms; admin stays German; existing records and ids intact; English shown when given, otherwise German with a marker on the item; draft/publish unchanged for English; preview in both languages; no per-language copies, no translation of course titles, people or room codes, no automatic translation. Not in scope: V2 styling, map, booking, newcomer pages.

| File | Responsibility |
| --- | --- |
| `src/lib/db/migrations.ts` | Schema v3: `json_insert` empty `titleEn`/`bodyEn` into existing draft and published JSON; `rooms.name_en`, `rooms.description_en` |
| `src/lib/announcements/schema.ts`, `policy.ts`, `projection.ts` | English fields in content, validation, pending-change comparison, public projection (`null` when empty) |
| `src/lib/rooms/schema.ts`, `repository.ts` | English room fields; public `nameEn`/`descriptionEn` |
| `src/lib/sessions/*` | Public session `room.nameEn` (session fields themselves have no English version) |
| `src/lib/i18n/public.ts` | `localize`, `fallbackLevel`, "Only in German" / "Partly in German" |
| `src/components/display/BoardLayout.tsx`, `src/components/public/*` | English text where present, German fallback with marker and `lang` |
| `src/components/admin/AnnouncementEditor.tsx`, `RoomForm.tsx` | "Englische Fassung (optional)" fields; editor preview with German/English view |
| `src/app/admin/(protected)/announcements/[id]/preview/page.tsx` | Large preview with `?sprache=en` |
| `scripts/seed-demo.ts`, `scripts/verify-restart.sh` | Demo records with full / partial / no English; restart check covers English fields |

- [x] Migration keeps existing content, ids, status and pending state (unit test on a schema-2 database; copy of the real `data/` database).
- [x] English output, partial and missing translations (unit + E2E, rooms and announcements).
- [x] English draft never changes published content before republishing; republish and withdraw cover both languages (unit + E2E).
- [x] Preview shows both language versions (editor and large preview, E2E).
- [x] One record per room/announcement; course data and room codes untranslated (unit + E2E).

Notes: the new tests were written after the code. To check they can fail, two deliberate breakages were tried and each was caught by a new unit test (removing the JSON upgrade from migration 3; ignoring English fields in the pending-change comparison); the code was restored afterwards. The first E2E run had two failures, both in test selectors (one new test, one existing navigation test that expected the old wording of the English footer note); no app code changed for them. Native German/English text quality was not reviewed by a person.
