# Shared contracts (M1 + M2 + bilingual content)

For teammates (map, schedule, booking, newcomer content) who want to integrate or build in parallel. **Implemented:** announcements (M1), rooms and class sessions (M2). Everything under "Open / proposed" is not built and **not yet agreed** with Arian, Parsa or Reza.

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
| `id` | Internal UUID, created by the server | **Never changes.** Sessions (and later bookings) reference rooms only by `id`. |
| `code` | Room number as on the door, e.g. `1.12`; unique (case-insensitive, archived rooms included); 1–20 characters: letters, digits, space `.` `-` `/` | Editable (typo fixes). Public. |
| `name` | Display name ≤ 80 | Editable |
| `floorId` | `EG` · `1OG` · `2OG` | Editable; the list itself is an assumption (see below) |
| `type` | `lecture` · `seminar` · `lab` · `study` · `common` · `office` · `other` | Editable |
| `description` | Plain text ≤ 500, may be empty | Editable |
| `reservable` | Marked for the future booking module (M4); no booking exists yet | Editable |
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
