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
| `MapFloor = { floorId, image, width, height }` — the three images from Aryan's delivery with their intrinsic pixel size. They are AI-generated illustrations (per the source), not verified campus or emergency plans. | pending (T07 `src/lib/map/config.ts`) |
| `RoomMapPosition = { roomId, floorId, x, y }`: origin top-left of the **image**, x to the right, y down, finite numbers in `[0, 1]` inclusive, relative to the image (not the viewport), at most one position per room id. | pending (T07) |
| A marker is drawn only if the room is in the current public room list, has a position, and the position's `floorId` equals the room's current `floorId`. Otherwise the room is still selectable as information, without a dot. Archived/unknown rooms never get a marker. | pending (T11) |
| K1-114 (48th entry, joint package) has no position. | pending (T07) |

### C2 Team demo rooms

| Rule | Status |
| --- | --- |
| One opt-in seed (`npm run db:seed-team-demo -- --yes`) creates the 48 catalog rooms with deterministic ids `lcc-demo-room-<code lower-case>` (e.g. `lcc-demo-room-k1-120`), `isDemo=true`. It requires `CAMPUS_BOARD_DB_PATH` and refuses the default `data/` database. | pending (T07) |
| Existing rows are never changed: an existing id is kept as is (also if archived or edited), a code owned by another id is reported as a collision and skipped. No guessing of ids at runtime. | pending (T07) |
| Initial `reservable=true` for the 21 codes chosen in the joint package (seed provenance only); all other imported areas `false`. | pending (T07) |
| Imported categories map 1:1 to existing room types (`seminar`, `common`, `lab`, `office`, `study`, `other`). | pending (T07) |
| A few clearly labelled demo class sessions on relative Berlin dates (today/tomorrow) so map → schedule → booking can be shown. Not the real timetable. | pending (T07) |

### C3 Public page URLs and context

| Parameter | Meaning | Status |
| --- | --- | --- |
| `raum` | Stable opaque room **id** on `/map`, `/schedule`, `/booking`. Never a room code. A value that is not an id of a suitable active room is shown as "room not available" with a deliberate choice; the app never substitutes another room. | pending (T09, T11) |
| `datum` | Berlin calendar date `YYYY-MM-DD` on `/schedule` and `/booking` | implemented on `/schedule`; booking pending (T09) |
| `etage` | Floor shown on `/map` when no room is selected | pending (T11) |
| `lang=en` | English public interface; kept on every public link and language switch with the other parameters | implemented for existing pages; new pages pending (T11–T13) |

Changing the floor on the map clears `raum` and keeps `lang`. APIs keep their parameter names `roomId` and `date`.

### C4 Booking policy (demo assumption)

One server definition in `src/lib/bookings/policy.ts`: time zone Europe/Berlin, storage in UTC ISO, 14 bookable dates including today (`daysAhead: 13`), 08:00–20:00, 15-minute grid, 15–120 minutes, start not in the past (server clock). Source: joint package; labelled as a demo assumption. Status: implemented (T04 import); single use by page and API pending (T09/T10).

### C5 Booking API

| Endpoint | Contract | Status |
| --- | --- | --- |
| `GET /api/public/availability?roomId&date` | 200 `{ serverTime, date, timeZone, policy, room, window, busy[], free[] }`. `busy` = actual class/booking spans clipped to the window (`kind: class \| booking`). `free` spans start and end on the 15-minute grid; spans shorter than 15 minutes are dropped. Advisory only. 400 `validation`, 409 `room_not_reservable` (unknown, archived or not reservable). | implemented; grid rounding pending (T10) |
| `POST /api/public/bookings` | Body `{ roomId, date, startTime, endTime, requestId (16 random bytes, base64url), cancelToken (32 random bytes, base64url) }`. Client generates both secrets; server stores only a SHA-256 hash of the token. Same-origin required (403 `forbidden_origin`). 201 new / 200 `replayed: true` for an exact retry (same request id, room, period and token, checked **before** time validation). 409 `request_id_reused`, `room_not_reservable`, `time_conflict`; 400 `validation` with `detail` code (`date_out_of_range`, `invalid_time`, `grid`, `in_past`, `invalid_input`); 503 `temporarily_unavailable` = retryable with the same body. | implemented; `detail` codes pending (T10) |
| `POST /api/public/bookings/:id/cancel` | `Authorization: Bearer <cancelToken>`; 200 (also for an already cancelled booking), 401 malformed token, 404 unknown id or wrong token (indistinguishable), 409 `booking_ended`, 503 retryable. Booking ids are UUIDs. | implemented |
| `GET /api/admin/bookings?from&days&roomId` | Admin only. `{ bookings: [{ id, roomId, roomCode, startsAt, endsAt, status, isDemo, createdAt, cancelledAt }] }`. Never contains token or hash. | implemented |
| `POST /api/admin/bookings/:id/cancel` | Admin only, same-origin. 200 / 404 / 409 `booking_ended`. | implemented |

Public responses carry machine-readable `error`/`detail` codes. The `message` field is German for logs and the admin; the public UI translates codes and never shows `message` in English mode. No public lookup or listing of bookings.

### C6 One occupancy invariant

| Rule | Status |
| --- | --- |
| Overlap is half-open: `existing.start < proposed.end && existing.end > proposed.start`. Cancelled classes and cancelled bookings never block; a class never blocks itself on edit. | implemented (T04) — consolidation pending (T10 `src/lib/occupancy/conflicts.ts`) |
| Every mutation that can create occupancy runs check + write in one `BEGIN IMMEDIATE` transaction on the same connection: booking create; class create, edit, reinstate; room archive and "reservable off". | pending (T10) |
| Bookability is `room active AND reservable` at the time of the write. Room code/name are not permission keys; no code allowlist at runtime. | pending (T10; removes the code allowlist imported in T04) |
| Class vs. class keeps `409 room_conflict` with `conflict { id, title, startsAt, endsAt }` (unchanged). Class vs. booking returns `409 booking_conflict` with `conflict { kind: "booking", id, startsAt, endsAt }` (admin API only). Nothing is cancelled silently. | pending (T10) |
| Archive refused while scheduled classes or confirmed bookings lie ahead: `409 room_in_use` with `upcomingSessions` and `upcomingBookings`. Switching `reservable` off refused while confirmed future bookings exist: `409 booking_in_use`. | implemented (T04) — counts/wording pending (T10/T16) |
| SQLite busy/locked → 503 `temporarily_unavailable`; clients retry with the identical request. | implemented for booking routes (T04) |

### C7 Public booking UI and receipt

| Rule | Status |
| --- | --- |
| The request (room, date, start, end, request id, token) is snapshotted before the request is sent; the receipt is built from that snapshot. While a request is in flight or its outcome is unknown, the selection is locked and in-app navigation (nav, language, Home, map, cancel, change) asks for confirmation; abandoning warns that a booking may already exist and the code would be lost. Forced reload/close is only protected by a best-effort browser prompt; credentials live in memory only. | pending (T08) |
| Receipt shows room (localized name), date, time, booking id and cancellation code; a visible 60-second countdown, "More time" and "Finish". Finish/expiry clears it and returns to Start in the current language. Unfinished forms do not time out. No general kiosk idle reset. The 60 s value is a provisional design choice to be tested with people. | pending (T13) |
| Credentials never go into URL, local/session storage, cookies or logs. | implemented (T04 keeps them in memory) — tests pending (T13) |

### C8 Admin booking view

`/admin/bookings`: list for a date range and optional room, with Berlin date/time, room and textual state; explicit cancellation with confirmation. A class form that hits a booking conflict links to this list filtered to the room and date. No editing, reinstating or analytics. Status: pending (T14).

### C9 Newcomer page

Static DE/EN content in `src/lib/newcomers/content.ts` (Reza's original, adapted). Links only to existing in-app destinations (map, schedule, notices). No contact, office hours or university policy unless a source is recorded in `docs/hci/research/newcomer-content-sources.md`. No CMS. Status: route implemented (T05); content/links pending (T15).
