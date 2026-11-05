# Shared contracts (M1 + M2 + bilingual content + team integration)

For teammates (map, schedule, booking, newcomer content) who want to integrate or build in parallel. **Implemented:** announcements (M1), rooms and class sessions (M2). The team integration (map, booking, newcomers) is specified in the last section, *Working integration contract (2026-10-31)*; its status column says what is implemented and tested. Older items under "Open / proposed" are kept for history.

General rules for every module:

- Admin write API: requires the admin session cookie; every non-GET request also needs a same-origin `Origin` header. Errors: `{ error, message, fieldErrors? }`.
- Public read API: no authentication, `Cache-Control: no-store`, only allowlisted fields. Response always contains `serverTime` (UTC ISO).
- Times are stored and sent as UTC ISO strings. Admin input uses Europe/Berlin wall-clock values.
- Demo data is labelled in content and with `isDemo: true`. Demo room codes start with `DEMO-` and are invented.

## Implemented: announcements (M1)

Source of truth: `src/lib/announcements/schema.ts`.

### Public read: `GET /api/public/announcements`

Returns only announcements that are published and inside their visibility window (server clock), pinned first, then newest.

```json
{
  "serverTime": "2026-10-24T18:47:00.000Z",
  "announcements": [
    {
      "id": "uuid",
      "title": "string ≤ 120",
      "body": "plain text ≤ 1200, may contain \n",
      "category": "general | event | important",
      "pinned": true,
      "publishedAt": "ISO UTC",
      "endsAt": "ISO UTC | null",
      "titleEn": "string ≤ 120 | null",
      "bodyEn": "string ≤ 1200 | null"
    }
  ]
}
```

### Admin write: `/api/admin/announcements/**`

Input times are `YYYY-MM-DDTHH:mm` (Berlin) or empty. `titleEn` and `bodyEn` are optional (missing or empty = no English version) and belong to the draft like every other field: saving them never changes the published snapshot; publishing copies both languages together; withdrawing removes both.

| Method + path | Effect |
| --- | --- |
| `GET /api/admin/announcements` | List (admin view incl. draft, published snapshot, state) |
| `POST /api/admin/announcements` | Create draft (`requestId` optional, makes retries idempotent) |
| `GET/PUT /api/admin/announcements/:id` | Read / save draft (public output unchanged) |
| `POST /api/admin/announcements/:id/publish` | Copy draft into the public snapshot |
| `POST /api/admin/announcements/:id/withdraw` | Remove from public output, keep content |

Status codes: 400 (validation), 401, 403 (origin), 404, 409 (not publishable / not published).

## Implemented: rooms and class sessions (M2)

Sources of truth: `src/lib/rooms/schema.ts`, `src/lib/sessions/schema.ts`. Unlike announcements, **rooms and sessions have no draft**: a successful save is public immediately.

### Identity of a room

| Field | Meaning | Stable? |
| --- | --- | --- |
| `id` | Opaque string. Admin-created rooms get a UUID; seed rooms use fixed readable ids (`demo-room-101`, `lcc-demo-room-k1-120`). Never validate room ids as UUIDs. | **Never changes.** Sessions, bookings and map positions reference rooms only by `id`. |
| `code` | Room number as on the door, e.g. `1.12`; unique (case-insensitive, archived rooms included); 1–20 characters: letters, digits, space `.` `-` `/` | Editable (typo fixes). Public. |
| `name` | Display name ≤ 80 | Editable |
| `floorId` | `EG` · `1OG` · `2OG` · `3OG` | Editable; the list itself is an assumption (see below) |
| `type` | `lecture` · `seminar` · `lab` · `study` · `common` · `office` · `other` | Editable |
| `description` | Plain text ≤ 500, may be empty | Editable |
| `reservable` | Admin-controlled booking permission for the demo booking module (runtime authority together with "not archived") | Editable; switching it off is refused while confirmed future bookings exist |
| `nameEn`, `descriptionEn` | Optional English versions (≤ 80 / ≤ 500); in input missing or empty = none; in public output `null` when empty | Editable; public immediately like every room field |

Rooms are **archived, never deleted** (the database refuses deleting a room that sessions reference). Archiving is refused while the room has scheduled sessions that have not ended. Archived rooms disappear from the public directory and cannot be chosen for new sessions; past sessions keep their reference and still show the room's code and name.

### Public read: `GET /api/public/rooms`

Active rooms, ordered by floor (`EG`, `1OG`, `2OG`), then natural code order (`1.9` before `1.10`).

```json
{
  "serverTime": "ISO UTC",
  "rooms": [
    {
      "id": "uuid",
      "code": "string",
      "name": "string",
      "floorId": "EG | 1OG | 2OG",
      "type": "lecture | seminar | lab | study | common | office | other",
      "description": "string",
      "reservable": false,
      "isDemo": false,
      "nameEn": "string | null",
      "descriptionEn": "string | null"
    }
  ]
}
```

### Public read: `GET /api/public/schedule?date=YYYY-MM-DD&roomId=<id>`

Sessions **starting** on one Europe/Berlin calendar day (default: today by the server clock), ordered by start time. Cancelled sessions are included with `status: "cancelled"` (shown as "Entfällt"). `roomId` is optional and must be an active room (else 404). Invalid date → 400.

```json
{
  "serverTime": "ISO UTC",
  "date": "2026-11-02",
  "room": null,
  "sessions": [
    {
      "id": "uuid",
      "title": "string ≤ 120",
      "instructor": "string ≤ 80",
      "cohort": "string ≤ 60, e.g. 'Wirtschaftsinformatik 2.0, 1. Semester'",
      "term": "WS 2026/27 | SS 2027",
      "startsAt": "ISO UTC",
      "endsAt": "ISO UTC",
      "status": "scheduled | cancelled",
      "room": { "id": "uuid", "code": "string", "name": "string", "nameEn": "string | null", "floorId": "EG" },
      "isDemo": false
    }
  ]
}
```

### Admin write

Session input: `{ title, instructor, cohort, term, roomId, date: "YYYY-MM-DD", startTime: "HH:mm", endTime: "HH:mm", requestId? }` in Berlin time; a session starts and ends on the same day. A start or end time that does not exist because of the spring DST switch is rejected.

| Method + path | Effect |
| --- | --- |
| `GET /api/admin/rooms[?includeArchived=1]` | List incl. `archivedAt`, `upcomingSessions` |
| `POST /api/admin/rooms` | Create (409 `duplicate_code`) |
| `GET/PUT /api/admin/rooms/:id` | Read / save (public at once) |
| `POST /api/admin/rooms/:id/archive` | Archive (409 `room_in_use` with `upcomingSessions`, 409 `already_archived`) |
| `POST /api/admin/rooms/:id/restore` | Make active again |
| `GET /api/admin/sessions?from=YYYY-MM-DD&days=1–62&roomId=` | Sessions starting in that Berlin date range (default: today, 7 days) |
| `POST /api/admin/sessions` | Create (409 `room_conflict` with `conflict`, 409 `room_archived`, 400 unknown room) |
| `GET/PUT /api/admin/sessions/:id` | Read / save (same checks; public at once) |
| `POST /api/admin/sessions/:id/cancel` | Cancel (stays public as cancelled; 409 `not_scheduled`) |
| `POST /api/admin/sessions/:id/reinstate` | Undo cancellation (room must be active and free; 409 `not_cancelled`) |

Server rules: two **scheduled** sessions may not overlap in the same room (half-open intervals, so 08:00–09:30 and 09:30–11:00 are fine; cancelled sessions free the slot). There is no check for overlaps of the same cohort or instructor.

## Open / proposed: integration choices to confirm with Arian, Parsa and Reza

These are working assumptions in the code, documented so they can be changed deliberately:

1. **Floors.** The code assumes three floors with ids `EG`, `1OG`, `2OG` (team notes mention a three-floor map; which floors those are was not confirmed). Ids are stored as text without a database constraint, so adding e.g. `UG` needs only a code change.
2. **How the map identifies a room.** Recommended: the map keeps a mapping *map shape → room `id`* (stable even if the code is corrected). Alternative: match on `code`; then a code edit in the admin breaks the link until the map is updated. Not decided.
3. **Room codes.** No official room numbers are in the system. Real codes must come from the team or the campus; the demo codes (`DEMO-E01` …) are invented on purpose.
4. **Map → details.** The public pages accept `/schedule?raum=<room id>` (sessions of today in that room; add `&lang=en` for English). A map could link there; nothing in the map exists yet.
5. **Semester (term).** Format `WS 2026/27` / `SS 2027`. The form suggests the term from the date assuming WS = October–March, SS = April–September; the server checks only the format.
6. **Cohort** is free text for now. A fixed list (study programme + semester) would allow filtering but needs real data.
7. **Booking (M4)** would use `reservable` and the same room `id`, and must check overlaps with scheduled sessions on the server. It would be a separate, narrowly validated public write endpoint, never the admin API.
8. **Kiosk navigation (updated 2026-10-25).** `/` is the public start page; every public page, including the `/display` board, has the same navigation (Start, Mitteilungen, Räume, Stundenplan) and no admin links. Still open (team/V2): whether the kiosk's idle screen is `/` or `/display`, an automatic return to the start page/German after inactivity, and where the map joins this navigation.
9. **Language (ADR-017, ADR-019).** `?lang=en` switches the public interface to English; German is the default and has no parameter. Public links keep `lang`, and the schedule keeps `datum` and `raum` when the day, room filter or language changes. A map linking into these pages should pass `lang` through. IDs, enum values (`floorId`, `type`, `category`) and times are language-neutral; labels are translated in the interface only. **Optional English content:** announcements (`titleEn`, `bodyEn`) and rooms (`nameEn`, `descriptionEn`) may carry an English version entered by the admin. One record per announcement/room; there are no per-language copies. A client in English shows the English field when it is non-null and otherwise the German field, marking the item ("Only in German" if nothing on it is in English, "Partly in German" if some of it is). Never translated and identical in both languages: room `code`, session `title` (official course title), `instructor`, `cohort`, `term`. No automatic translation.

## Working integration contract (2026-10-31)

Branch `integrate/team-v1-20261031`. These are **provisional engineering defaults** that Ali asked to be implemented for the team integration (task T06 in `docs/plans/team-integration-2026-10-31/`). They are not a recorded agreement of all four team members and not a university policy. The 2026-10-28 proposal (`docs/proposals/2026-10-28-team-contracts-v1.md`) is the older draft; where this section differs, this section describes the code. Each rule carries the status it actually has.

Status legend: **implemented** = in code; **tested** = covered by a test that was actually run green on this branch (test file named); **pending** = not yet in code.

### C1 Floors and map geometry

| Rule | Status |
| --- | --- |
| Floor ids `EG`, `1OG`, `2OG`, `3OG`. Old ids keep their meaning; nothing is renamed. Only `1OG`/`2OG`/`3OG` have a map image; a room on `EG` shows "no map for this floor". | implemented (T04 added `3OG`) |
| `MapFloor = { floorId, image, width, height }` — the three images from Aryan's delivery with their intrinsic pixel size. They are AI-generated illustrations (per the source), not verified campus or emergency plans. | tested (`map-config.test.ts`) |
| `RoomMapPosition = { roomId, floorId, x, y }`: origin top-left of the **image**, x to the right, y down, finite numbers in `[0, 1]` inclusive, relative to the image (not the viewport), at most one position per room id. | tested (`map-config.test.ts`) |
| A marker is drawn only if the room is in the current public room list, has a position, and the position's `floorId` equals the room's current `floorId`. Otherwise the room is still selectable as information, without a dot. Archived/unknown rooms never get a marker. | tested (`map-config.test.ts`, `map-integration.spec.ts`) |
| K1-114 (48th entry, joint package) has no position. | tested |

### C2 Team demo rooms

| Rule | Status |
| --- | --- |
| One opt-in seed (`npm run db:seed-team-demo -- --yes`) creates the 48 catalog rooms with deterministic ids `lcc-demo-room-<code lower-case>` (e.g. `lcc-demo-room-k1-120`), `isDemo=true`. It requires `CAMPUS_BOARD_DB_PATH` and refuses the default `data/` database. | tested (`team-demo.test.ts`) |
| Existing rows are never changed: an existing id is kept as is (also if archived or edited), a code owned by another id is reported as a collision and skipped. No guessing of ids at runtime. | tested |
| Initial `reservable=true` for the 21 codes chosen in the joint package (seed provenance only); all other imported areas `false`. | tested |
| Imported categories map 1:1 to existing room types (`seminar`, `common`, `lab`, `office`, `study`, `other`). | tested |
| A few clearly labelled demo class sessions on relative Berlin dates (today/tomorrow) so map → schedule → booking can be shown. Not the real timetable. | implemented |

### C3 Public page URLs and context

| Parameter | Meaning | Status |
| --- | --- | --- |
| `raum` | Stable opaque room **id** on `/map`, `/schedule`, `/booking`. Never a room code. A value that is not an id of a suitable active room is shown as "room not available" with a deliberate choice; the app never substitutes another room. | tested (`booking-selection.spec.ts`, `map-integration.spec.ts`) |
| `datum` | Berlin calendar date `YYYY-MM-DD` on `/schedule` and `/booking` | tested on `/schedule`, `/booking`, `/map` |
| `etage` | Floor shown on `/map` when no room is selected | tested |
| `suche` | Search text on `/rooms` (≤ 100 characters), kept in sync by the page without navigation (`history.replaceState`). An incoming navigation (Back/Forward, language switch, bare `/rooms` link) is authoritative and replaces the page's search state (SEARCH-R001); the language links are built from the current URL. Not sent to any API: matching runs in the browser on `/api/public/rooms` and `/api/public/schedule` data | tested (`room-search.spec.ts`) |
| `datum` on `/rooms` | Day of the class results of the search (Berlin date; default today by the server clock); passed on to the result links `/map?raum=&datum=` and `/schedule?datum=&raum=` | tested (`room-search.spec.ts`) |
| `lang=en` | English public interface; kept on every public link and language switch with the other parameters | tested (`integrated-navigation.spec.ts`) |

Changing the floor on the map clears `raum` and keeps `lang`. APIs keep their parameter names `roomId` and `date`.

### C3a Public search (T32, classroom part of T33; 2026-11-01)

| Rule | Status |
| --- | --- |
| One matcher (`src/lib/search/match.ts`) for `/rooms` and the map: lower case, accents removed, `ß`→`ss`, punctuation/whitespace runs → one space; umlauts also matched as `ae`/`oe`/`ue`. Rooms: code, German or English name contains the text, or exact code with/without `K1-` (`K1-105`, `K1 105`, `k1-105`, `105`). | tested (`search-match.test.ts`) |
| Blank query = no filter. A non-blank query that normalizes to nothing (e.g. `!!!`) matches **nothing** (the map's earlier inline matcher matched every room for such a query). | tested |
| Classes: course `title` or `instructor` of the selected day contains the text; cancelled sessions are included and labelled. Approved aliases only, applied when they are the whole query and as whole words: `Chris` → Christian Zagel, `MMI`/`HCI` → Mensch-Maschine-Interaktion. No other abbreviation or translation. A broad name (`Christian`) lists every match. | tested |
| A class result is the **room of that class on that day**, never an office or a person's location. Office/staff lookup (T33 remainder) needs confirmed data from T34 and is not implemented. | implemented (wording tested in both languages) |
| A failed schedule request shows the error/retry state, not "no classes"; a response for a previously selected day is never shown. Room search keeps working when the schedule fails. Polling never resets the query or day. | tested (`room-search.spec.ts`) |
| A class whose room is no longer active is shown without map/schedule links ("no longer in the room directory"). | tested |

### C4 Booking policy (demo assumption)

One server definition in `src/lib/bookings/policy.ts`: time zone Europe/Berlin, storage in UTC ISO, 14 bookable dates including today (`daysAhead: 13`), 08:00–20:00, 15-minute grid, 15–120 minutes, start not in the past (server clock). Source: joint package; labelled as a demo assumption. Status: tested; page, API and client use `bookingDateRange`/`BOOKING_POLICY` (`integration-contracts.test.ts`).

### C5 Booking API

| Endpoint | Contract | Status |
| --- | --- | --- |
| `GET /api/public/availability?roomId&date` | 200 `{ serverTime, date, timeZone, policy, room, window, busy[], free[] }`. `busy` = actual class/booking spans clipped to the window (`kind: class \| booking`). `free` spans start and end on the 15-minute grid; spans shorter than 15 minutes are dropped. Advisory only. 400 `validation`, 409 `room_not_reservable` (unknown, archived or not reservable). | tested (`occupancy.test.ts`, `booking-api.spec.ts`) |
| `POST /api/public/bookings` | Body `{ roomId, date, startTime, endTime, requestId (16 random bytes, base64url), cancelToken (32 random bytes, base64url) }`. Client generates both secrets; server stores only a SHA-256 hash of the token. Same-origin required (403 `forbidden_origin`). 201 new / 200 `replayed: true` for an exact retry (same request id, room, period and token, checked **before** time validation). 409 `request_id_reused`, `room_not_reservable`, `time_conflict`; 400 `validation` with `detail` code (`date_out_of_range`, `invalid_time`, `grid`, `in_past`, `invalid_input`); 503 `temporarily_unavailable` = retryable with the same body. | tested (`booking-api.spec.ts`, `booking-pending.spec.ts`) |
| `POST /api/public/bookings/:id/cancel` | `Authorization: Bearer <cancelToken>`; 200 (also for an already cancelled booking), 401 malformed token, 404 unknown id or wrong token (indistinguishable), 409 `booking_ended`, 503 retryable. Booking ids are UUIDs. | implemented |
| `GET /api/admin/bookings?from&days&roomId` | Admin only. `{ bookings: [{ id, roomId, roomCode, startsAt, endsAt, status, isDemo, createdAt, cancelledAt }] }`. Never contains token or hash. | implemented |
| `POST /api/admin/bookings/:id/cancel` | Admin only, same-origin. 200 / 404 / 409 `booking_ended`. | implemented |

Public responses carry machine-readable `error`/`detail` codes. The `message` field is German for logs and the admin; the public UI translates codes and never shows `message` in English mode. No public lookup or listing of bookings.

### C6 One occupancy invariant

| Rule | Status |
| --- | --- |
| Overlap is half-open: `existing.start < proposed.end && existing.end > proposed.start`. Cancelled classes and cancelled bookings never block; a class never blocks itself on edit. | tested (`occupancy.test.ts`) |
| Every mutation that can create occupancy runs check + write in one `BEGIN IMMEDIATE` transaction on the same connection: booking create; class create, edit, reinstate; room archive and "reservable off". | tested incl. worker-thread race on separate connections (`booking-concurrency.test.ts`) |
| Bookability is `room active AND reservable` at the time of the write. Room code/name are not permission keys; no code allowlist at runtime. | tested (rename keeps bookability) |
| Class vs. class keeps `409 room_conflict` with `conflict { id, title, startsAt, endsAt }` (unchanged). Class vs. booking returns `409 booking_conflict` with `conflict { kind: "booking", id, startsAt, endsAt }` (admin API only). Nothing is cancelled silently. | tested |
| Archive refused while scheduled classes or confirmed bookings lie ahead: `409 room_in_use` with `upcomingSessions` and `upcomingBookings`. Switching `reservable` off refused while confirmed future bookings exist: `409 booking_in_use`. | tested |
| SQLite busy/locked → 503 `temporarily_unavailable`; clients retry with the identical request. | implemented for booking and admin occupancy routes; lock contention itself not provoked in tests |

### C7 Public booking UI and receipt

| Rule | Status |
| --- | --- |
| The request (room, date, start, end, request id, token) is snapshotted before the request is sent; the receipt is built from that snapshot. While a request is in flight or its outcome is unknown, the selection is locked and in-app navigation (nav, language, Home, map, cancel, change) asks for confirmation; abandoning warns that a booking may already exist and the code would be lost. Forced reload/close is only protected by a best-effort browser prompt; credentials live in memory only. | tested in-app (`booking-pending.spec.ts`); reload/close prompt not tested |
| Receipt shows room (localized name), date, time, booking id and cancellation code; a visible 60-second countdown, "More time" and "Finish". V2 (2026-11-04): Finish on a confirmed receipt requires the explicit saved-credentials checkbox; a cancelled replay does not. Finish/expiry clears it and returns to Start in the current language. The final-15-seconds warning shares the existing countdown layout cell, so the time-extension action does not move behind the dock. Unfinished forms do not time out. No general kiosk idle reset. The 60 s value is a provisional design choice to be tested with people. | tested technically (`booking-language-receipt.spec.ts`); human test NOT RUN |
| Credentials never go into URL, local/session storage, cookies or logs. | implemented; E2E checks no receipt after back navigation |
| (Clarified 2026-11-01, V1-R001) A successful answer is shown by the returned `booking.status`: `confirmed` → saved receipt; `cancelled` (an exact retry of a booking cancelled in the meantime) → "booking is cancelled" state with id/room/time but no cancellation code, nothing re-created; any other or unreadable answer → outcome unknown, same request kept for retry. No API change. | tested (`booking-pending.spec.ts`, `review-booking.spec.ts`, `booking-result.test.ts`) |
| (Clarified 2026-11-01, V1-R002) The receipt keeps the room's German/English source names and localizes them with the current language when shown; a language switch changes name and fallback marker but does not resend, reset the countdown or change id/code. | tested (`booking-language-receipt.spec.ts`, `review-booking.spec.ts`) |

### C8 Admin booking view

`/admin/bookings`: list for a date range and optional room, with Berlin date/time, room and textual state; explicit cancellation with confirmation. A class form that hits a booking conflict links to this list filtered to the room and date. No editing, reinstating or analytics. Status: tested (`admin-bookings.spec.ts`).

### C9 Newcomer page

Static DE/EN content in `src/lib/newcomers/content.ts` (Reza's original, adapted). Links only to existing in-app destinations (map, schedule, notices). No contact, office hours or university policy unless a source is recorded in `docs/hci/research/newcomer-content-sources.md`. No CMS. Status: tested in-app links DE/EN (`integrated-navigation.spec.ts`); real facts pending (T21).

### C10 Public kiosk layout and navigation dock (V2 Stage 1, AL-02; 2026-11-03)

Written for Aryan, Parsa and Reza: what the shared public shell now guarantees and what a module must not break. Every size is a **provisional design choice**; the real viewport, zoom, DPR, mounting height and reach of the Elo screen are still unmeasured (V2-P0), and nothing here has been tried on the physical screen or with people. Status words as above: **implemented** = in code; **tested** = covered by a check that was actually run (names the check).

| Rule | Status |
| --- | --- |
| **Kiosk mode** is chosen by viewport and orientation only: `(orientation: portrait) and (min-width: 520px)`. It is **not** based on `pointer: coarse` or `hover: none` (true only when touch is emulated or detected). The rule is one string in `src/lib/public-layout.ts` (`PUBLIC_KIOSK_MEDIA`) and is written once in `src/app/globals.css` as the Tailwind variant `kiosk:` and the root scale; no explicit override exists (a `?kiosk=` parameter would have to be carried by every link). A portrait tablet or a tall narrow window is also in kiosk mode. | implemented; tested (`public-kiosk-layout.test.ts` keeps CSS and TypeScript equal; `kiosk-dock.spec.ts` runs the same assertions with touch emulation on and with a pointer-fine portrait context; a deliberate pointer-based mutation was caught) |
| **Scope.** Only pages that render `PublicShell` carry `data-public-shell`; the kiosk root size applies to `:root:has([data-public-shell])`. Admin, login and every other page keep the 16 px root. The announcement board (`/display`, `BoardLayout`) sizes in container units (`cqw`) and is not scaled by the root. | implemented; tested (admin login root 16 px) |
| **Scale** (Tailwind sizes are rem-based, so one root change grows text, buttons, spacing and the column together): root 16 px up to a 720 px viewport, rising linearly to 22 px at 1080 px (1.375×), written in % so a larger browser default is still respected. At 1080 px: body 18 → 24.75 px, H1 36 → 49.5 px, smallest regular text 14 → 19.3 px, button/tile minimum height 56 → 77 px, content column 728 → 1001 px. At 540 px (a 200 % zoom) the root stays 16 px, so zoom keeps its effect. | implemented; measured in nominal emulation only (`docs/evidence/v2-ali-stage-1-2026-11-03/measurements.md`) |
| **Dock.** Language switch and the one `<nav aria-label>` (seven destinations) sit in one element, `[data-public-dock]`. Outside kiosk mode it is `display: contents` (both stay in the header as before); in kiosk mode it is `position: fixed` to the bottom edge (`z-40`): language switch on top, then the navigation as **four tiles, then three centred as a group**. The centre is the container/viewport width divided by two (flex `justify-center` over a full-width row), not a fixed 540 px. There is never a second link set. Gaps ≥ 8 px (0.75 rem). On `/display` the dock is an in-flow last child of the 9:16 frame, in `cqw`. | implemented; tested (`kiosk-dock.spec.ts`: 4+3 and centre ±2 px, language gap, tile height, one `<nav>`, all 8 routes × DE/EN × four kiosk contexts) |
| **Reserved space.** `--public-dock-h` is the real dock height: `DockHeightSync` (client leaf) sets it from a `ResizeObserver` and removes it outside kiosk mode; `globals.css` holds a first-paint estimate (15 rem). In kiosk mode the shell root has `padding-bottom: var(--public-dock-h)` and the page `scroll-padding-bottom: calc(var(--public-dock-h) + 1rem)`, so the last content/footer ends above the dock and keyboard focus or `scrollIntoView` does not land under it. A module that adds its own fixed or sticky bottom element must use the same token and must not stack a second fixed bar. Native `<dialog>` modals (the leave dialog) are in the top layer, above the dock. | implemented; tested (end of page above the dock on 7 pages × DE/EN × three kiosk contexts; a Tab walk through page content and Shift+Tab to the last control, at 1080×1700 and 540×960; both guards fail when the reservation is removed) |
| **Active state** is shown by more than colour: the current destination has a bar (inset shadow), the current language an underline, in addition to `aria-current`. Applies to all layouts. | implemented; tested (`kiosk-dock.spec.ts`) |
| **Query and language behaviour is unchanged.** Dock links are the same links as before (`publicHref(path, lang)`): the language is kept, `suche`/`datum`/`raum` are not copied to other destinations, a bare Rooms link clears the search, Back/Forward and SEARCH-R001 behave as in C3/C3a. The language switch still keeps the current page's own context (`LanguageSwitch` params; `LiveLanguageSwitch` on `/rooms`, no prefetch). | tested (`kiosk-dock.spec.ts` search → English → bare Rooms → Back/Forward through the dock; the existing 75 browser tests) |
| **Leave guard.** The existing pending/uncertain-booking guard intercepts dock clicks exactly as it intercepted the old navigation (capture-phase `a[href]` handler); staying keeps the request. V2 (2026-11-04): a confirmed receipt is guarded too; an explicit Stay/Leave dialog protects in-app links. Only a language-only change on the same origin/path/query is allowed without a dialog, retaining the memory state. Pending/uncertain requests remain guarded even for language changes. Forced reload/close/Back remain best-effort limits, not guaranteed receipt recovery. | tested (`kiosk-dock.spec.ts`; `booking-pending.spec.ts`) |
| **Shared note.** The English "course titles, lecturers … in German" note (`contentNote`) is shown only on `schedule` and `rooms`, where class titles appear; not on start, newcomers, map, booking, cancel or the board. Functional status, errors and "Only/Partly in German" markers are unchanged. | tested (`kiosk-dock.spec.ts`, `public-navigation.spec.ts`) |

**Known limits and side effects (not hidden):** the dock is 311 px high at 1080 px width: 16 % of a 1920 px viewport and 18 % of a 1700 px one; at 540×960 it is 227 px (24 %), a heavy share if the real viewport turns out that small. It comes first in DOM and tab order although it is drawn last; the skip link planned for Stage 3 now exists (C14). The larger text lengthens pages: `/rooms` grows from 8.6 to 11.9 screens at 1080×1920 and the booking confirm button now lies further below the fold. Map markers (rem-based classes in `CampusMap.tsx`) scale with the root, so their size grows (24 → 31.5 px high) while the 21 markers still stay under 44 px and still overlap; that module is Aryan's task AP-01. None of this is a physical or human result.

### C11 Home, Newcomers and Rooms layout (V2 Stage 2, AL-03/AL-04; 2026-11-04)

Builds on C10 (kiosk dock, scale, reserved space). All sizes are **provisional design choices**; nothing here was tried on the physical Elo screen or with people. Status words as above.

| Rule | Status |
| --- | --- |
| **Home** shows the six destinations after Start as large cards (`[data-testid=home-card]`), in the navigation's order, same `publicHref` links as the dock. Each card has a decorative inline-SVG pictogram (`src/components/public/Pictograms.tsx`, registry `src/lib/public-pictograms.ts`, no icon dependency), the destination's name and its existing one-line description; a pictogram never replaces the label. Two columns from 640 px, one below. In kiosk mode the grid fills the space between the heading and the dock (≈ 380 px cards at 1080×1920, 313 px at 1080×1700, so Home still fits one screen there). | implemented; tested (`stage2-layout.spec.ts`: 6 cards, hrefs, label + description + one pictogram, columns, minimum size, no overflow, cards end above the dock; contrast ≥ 4.5:1 text, ≥ 3:1 pictogram) |
| **Newcomers**: the long coloured prototype block is removed in DE and EN (old strings gone). A compact, unfilled line `[data-testid=prototype-marker]` ("Prototyp · Beispieldaten – kein offizielles Informationssystem der Hochschule Coburg." / English equivalent) remains. Four task cards form a 2 × 2 grid, the help card spans the full width below them with a secondary (outlined) action. Card texts are rendered **verbatim, in the order, from `src/lib/newcomers/content.ts` (Reza's file, not edited)**; a pictogram per card comes from `NEWCOMER_PICTOGRAM`. The old line "check important details with official sources" was dropped with the block. | implemented; tested (text verbatim, order, hrefs, one link per card, hierarchy, equal row heights, full-width help card, no clipping) |
| **Rooms: floor chips** (`[data-testid=floor-jump]`, one button per floor that has rooms in the list, full touch height). A tap scrolls that floor's heading to just under the chips (or as far as the page allows), moves focus to the heading (`tabIndex=-1`) and changes neither the URL nor the history. In kiosk mode the bar is pinned to the top of the screen (the dock is at the bottom); elsewhere it is static. `scroll` is smooth unless reduced motion is requested. | implemented; tested at six viewports in DE/EN (heading position, focus, URL and `history.length` unchanged) |
| **Rooms: room cards** keep their stable ids (`data-room-id`) and links; the actions (today in this room / on the map / book) share one row from 520 px (stacked on phones). Labels may wrap to two lines; text and button height are not reduced. Median card pitch 402 → 259 px and page length 11.9 → 8.2 screens at 1080×1920 (22,760 → 15,687 px; the audited V1 was 8.56 screens). | implemented; measured in nominal emulation (`docs/evidence/v2-ali-stage-2-2026-11-04/measurements.md`) |
| **Rooms: search results.** `src/lib/search/results-layout.ts` decides the order: when no room matches but classes do, the matching classes lead and the room group follows with "no room matches … the results are the classes above"; while the class request is loading no "no room" message is shown; with nothing found, or when the class request failed, the original plain message stays. Rooms lead whenever one matches. The two groups keep their React keys, so the class request and its polling are not restarted when the order changes. | implemented; tested (unit rule; browser DE/EN incl. a held-back class request) |
| **Day scope.** The class group states "Die Suche gilt nur für diesen Tag." / "The search covers this one day only." in addition to the date in its heading, followed by the existing note that the room shown is where the class takes place, not an office or a person's location. No office or staff mapping was added or guessed; a multi-day/"next class" search remains a separate proposal. | implemented; tested |
| **Unchanged** (existing `room-search.spec.ts`, 9 tests incl. SEARCH-R001 Back/Forward/bare-link/fast-typing): URL ↔ state mirroring, normalisation and approved aliases, clear/focus, language switch (`LiveLanguageSwitch`), stale-day protection, error vs "no classes". | tested (existing suite, no assertion edited) |

**Ordinary layouts changed as a side effect, by design:** the Rooms action row and Home's two columns also apply on laptops (Rooms 18.3 → 12.6 screens at 1440×900); phones keep stacked actions and one-column Home.
**Open:** no human check; real viewport/reach unknown (V2-P0); the dock-first tab order and skip link were left to Stage 3 (now C14); the `map-integration` marker-position test is intermittent on the Stage 1 build as well (Aryan's module, see the Stage 2 evidence README).

### C12 Combined Parsa V2 integration (2026-11-04)

Ali authorized integration and review corrections after Claude Stage 2. Parsa supplied the module proposal; Ali/Codex adapted it to the current source. [Provenance](team-sources/parsa-v2/README.md), [validation and limits](evidence/v2-integration-2026-11-04/README.md). This extends C7/C10; schema, IDs, API payloads, atomic occupancy rules and the 36-character ID/43-character token remain unchanged.

- **Receipt/review:** the review section and receipt scroll into view when entered. A saved-credentials checkbox gates explicit Done on confirmed receipts, in either language. A warning at ≤15 seconds is announced in the reserved countdown area; Both actions share two columns throughout kiosk mode (including520–639px); phones below520 retain stacking. More time resets to 60 seconds. Switching language does not reset the timer, code or acknowledgement. Expiry still clears memory and returns Home; the checkbox is not persistence or recovery.
- **Leave protection:** confirmed receipt links ask first (Stay keeps credentials; Leave clears them). A same-page language-only switch is allowed. Pending/unknown warnings explicitly say that the booking may already exist after leaving and credentials would be lost. This is best-effort protection, not full browser-history interception.
- **Cancellation:** default hidden code with an explicit show/hide button; no automatic correction/capitalization/spellchecking requested on either credential field; short DE/EN length/paste guidance. These browser hints are not proof of the physical on-screen keyboard’s behaviour. Localized DE/EN document title.
- **Schedule→booking:** only an active, reservable selected room within server-today…today+13 days gets the CTA. The stable room ID, selected date and language are kept. A past/out-of-window date or non-reservable room offers no CTA. No new booking permissions are inferred from room codes.
- **Missing schedule room:** HTTP404 displays a localized unavailable-room message with an All rooms recovery link keeping the selected day/language. `usePolledJson` exposes `httpStatus` and invalidates cached data on authoritative404, so a following network/server failure cannot resurrect an archived room. Ordinary failures keep the last good data; a successful response or changed URL restores the normal state. Poll interval/timeouts remain unchanged.
- **Status:** implemented in the combined candidate; consult the linked evidence for the actual final checks. No physical/human verification and no claim of measured UX benefit. Stage3 accessibility, Aryan’s map work and Reza’s final copy remain open.

### C13 Measured map groups and chooser lifecycle (Aryan AP01, 2026-11-04)

Extends C1/C3/C10 without changing room IDs, image-relative positions, APIs, routes or the database. [Source and attribution](team-sources/aryan-ap01/README.md), [actual repair checks](evidence/aryan-ap01-fix-2026-11-04/README.md).

- Grouping uses the **actual rendered map layer** and measured single/cluster hit dimensions from hidden, noninteractive probes sharing the visible controls’ rem-based size classes. ResizeObserver tracks the layer and probes. No guessed hit rectangles are rendered before sizing is available. The helper’s default72×44/44×44 sizes describe a16px root only, not a kiosk guarantee. Its6px grouping gap is a design safeguard, not a certification.
- Single pins retain their x/y. A group’s centroid is only a choice affordance. It opens a list of current live room records. Search, renamed room codes, floor mismatch protection and links to schedule/booking remain ID-bound. Inaccessible/archived rooms are not silently substituted.
- Opening focuses the chooser heading. Explicit Close restores the opener or map region. Choosing a room focuses its details. If polling/regrouping removes a chooser that owned focus, pre-removal callback-ref cleanup restores related focus only while the document is otherwise unfocused. Search/floor interactions take precedence. An invalidated expanded key is cleared, so restoring a room or viewport does not reopen the chooser or steal search focus.
- English chooser names use existing localize/FallbackTag rules. German-only room names show the existing English fallback marker. No automatic translation or copied language-specific room records.
- **Technical verification:** regressions cover measured geometry, explicit/implicit focus transitions, restore without reopening, EN fallback, source identity and floor invalidation. See evidence for final suite results. Actual Elo touch/reach, human task success, screen-reader behaviour and measured UX benefit remain **NOT TESTED**. Stage3 is outside this integration checkpoint.

### C14 Shared accessibility and page identity (V2 Stage 3, AL-05; 2026-11-04/05)

Builds on C10 (dock, reserved space), C11 (floor chips) and C13 (map groups; not edited). Stage3 checks below concern what a **browser reports** in headless Chromium emulation. They are **not** a screen-reader session, a WCAG conformance audit or a usability result; Stage3 has not been tried on the physical Elo screen or with people. Status words as above.

| Rule | Status |
| --- | --- |
| **Document language.** The root layout stays static `lang="de"`: installed Next.js 16.4.3 layouts receive no `searchParams` and do not re-render on navigation, and the documented per-request `lang` needs a `[lang]` path segment, which would rewrite every public URL (out of scope). Instead the client leaf `DocumentLang` (`src/components/public/DocumentLang.tsx`), rendered by `PublicShell` and by `/display`, sets `<html lang>` to the page language after hydration and restores `de` when it unmounts. The wrapper element of the shell and of the board already carried the right `lang` from the first byte (so the practical effect on assistive technology was smaller than the audit's "8 of 8 routes say de"). **Limit:** the server HTML of an English route still says `lang="de"` until hydration (document-level metadata, browser translate prompts). The admin keeps `de`. | implemented; tested (`stage3-accessibility.spec.ts`: 8 public routes × DE/EN, a client-side DE→EN→DE switch without reload, admin login stays `de`) |
| **Page identity.** Each public page has a title in its own language ending in " – Campus Board" and exactly one `h1`. `/display` had no `h1` (board title `h2`, announcement titles `h3`): the board title is now the `h1` and the announcement titles are `h2` (`BoardLayout` props `pageHeading`, `logoHref`; `DisplayBoard` passes both). Classes, container-unit sizes and the card layout are unchanged (heading px and screenshot hashes identical before/after in 5 contexts × DE/EN); the admin preview, which sits under an admin `h1`, keeps `h2`/`h3`. Ali's final integration aligns the cancellation metadata suffix too; booking logic is unchanged. | implemented; tested (strict titles and `h1` count on 8 routes × DE/EN; cancellation suffix failed in DE/EN before the fix; `/display` heading levels and sizes) |
| **Skip link.** `SkipLink` is the first element of `PublicShell`, therefore the **first Tab stop** (before the dock, which is first in DOM order), labelled "Zum Inhalt springen" / "Skip to main content". It is off screen until it has keyboard focus, then fixed at the top left, at least 56 px high (16 px root), white on ink. Activation (click or Enter) is handled in the page: a capture-phase listener calls `preventDefault()` and focuses `<main id="main-content" tabIndex={-1}>` (no outline on the landmark). No `#main-content` enters the URL or the history. The booking leave guard (`useLeaveGuard`) already ignores `defaultPrevented` clicks, so an in-page skip does **not** open the leave dialog while a request is pending. The next Tab stop is inside the content, not the dock. `/display` has no dock before its content, so it has no skip link (its first stop is the logo link). | implemented; tested (first tab stop, on-screen and uncovered, ≥ 44 px, contrast ≥ 4.5:1, focus on `main`, URL unchanged, next stop in content — 7 routes × DE/EN × 5 contexts; pending-booking case) |
| **Focus clearance, top and bottom.** Bottom is C10 (`scroll-padding-bottom`). Top: while the floor-chip bar of `/rooms` is pinned (kiosk mode) `FloorJump` publishes its height + 8 px as `--public-sticky-top` on the root and removes it when unpinned or unmounted; `globals.css` uses it as `scroll-padding-top`. A module that adds its own sticky top element must publish the same token. | implemented; tested (Shift+Tab onto a link that sat behind the bar and Tab onto one behind the dock, then a 14-step forward and 28-step backward walk, after every key press; 3 kiosk contexts × DE/EN) |
| **Link names.** Every room action link ("Heute in diesem Raum" / "Auf der Karte zeigen" / "Raum reservieren (Demo)" and the class-result "Auf der Karte" / "Termine in diesem Raum") ends in a visually hidden ` – <room code>`. The visible label stays **first** in the name (WCAG 2.5.3 label in name); hrefs, order and layout are unchanged. On `/rooms` this turns 131 links with 3 distinct names into 131 distinct names. | implemented; tested (accessibility-tree snapshot of the directory and of class results, DE/EN; the Stage 2 test now asserts "label – code" for all three actions) |
| **Placeholder contrast.** `[data-public-shell] ::placeholder` uses the muted ink at full opacity: 6.39:1 on white (was 3.11:1: half-transparent ink). Applies to the room search and, through the same shell, to the map search. | implemented; tested (computed colour, DE/EN, /rooms and /map, kiosk and laptop) |
| **Logo.** The logo is a link to Home in the current language on every public page, including `/display` (not in the admin preview); its image name is "Hochschule Coburg – Start/Home". | implemented; tested |
| **Active state beyond colour** (bar + `aria-current`, underline for the language) is the C10 rule; unchanged and still covered by `kiosk-dock.spec.ts`. | unchanged; existing tests |
| **Unchanged:** routes, query semantics, room IDs, APIs, schema, booking token/lifetime/receipt rules, the leave guard, polling, copy of Reza's `content.ts`, Aryan's `CampusMap.tsx`, Parsa's booking logic and `DaySchedule.tsx`. Only cancellation page metadata changed during final integration. | existing suite |

**Not done / limits (not hidden):** no screen-reader session (VoiceOver, NVDA), no Firefox/WebKit, no on-screen or native keyboard, no WCAG conformance claim, no human result, nothing on the Elo screen. The skip link is useful for keyboard users; touch users never see it. The optional "more notices" cue (AL-07/T47) was **not** built.

**Completion review, 5 November:** typecheck/lint/build, 187 unit tests, 180 Chromium tests and 13 restart checks pass on a source-matched isolated copy; separate read-only review found no actionable runtime regression. Original capture provenance limits, the stricter metadata regression and audit-runner repair are recorded in the [Stage3 evidence](evidence/v2-ali-stage-3-2026-11-04/README.md). This closes the technical shared part of AL-05; AL-06 and physical/human acceptance remain partial.
