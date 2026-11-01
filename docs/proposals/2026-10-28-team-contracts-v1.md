# Team integration contracts — proposal v1

Date: 2026-10-28 · Baseline: `main` at `4ae9808` (local and GitHub checked).

**Status: proposed interfaces, awaiting team approval. No new routes, tables or features in this document are implemented.** Existing behaviour remains defined by [contracts.md](../contracts.md). After approval, accepted sections move there and the README/Kanban is updated. This document does not itself approve another member's work or assign their tasks without confirmation.

Ali explicitly approved **limited, persistent bookings in the existing SQLite database**, without student accounts or email, on 2026-10-28. The detailed policies and ownership below still need confirmation with Parsa and the team.

## 1. Approach and scope

| Approach | Trade-off | Recommendation |
| --- | --- | --- |
| Static map configuration + existing room APIs + SQLite booking module + static newcomer content | Reuses the current application; persistent conflicts can be tested | **Recommended; persistence approved by Ali** |
| Click-through booking simulation | Less backend work, but cannot claim persisted or concurrent bookings | Not selected by Ali |
| Separate app/database or university integration | More integration work and new dependencies | Outside MVP |

Keep Next.js, React, TypeScript, Tailwind, SQLite, authentication, room IDs, time helpers and existing endpoints. GitHub holds code, contracts and sample fixtures; SQLite holds runtime data. Two devices in the same demo connect to the same server/database. Independent developer databases are allowed.

Currently implemented: announcements including DE/EN drafts/publishing, rooms, class sessions, public start/navigation/language selection. Not implemented: map, bookings, newcomer pages, new cross-module conflict guards. Historical test results do not prove these proposals work.

## 2. Room map — data contract

### 2.1 Identity and floors

- Treat `room.id` as an opaque string, never parse it as a room number or require UUID syntax. Admin-created rooms use UUIDs; the existing seed uses fixed IDs such as `demo-room-101`.
- Reference rooms by `roomId`; names, codes and `floorId` come from `GET /api/public/rooms`, including existing English fallbacks.
- Import the existing `FloorId` from `src/lib/rooms/schema.ts`. Its current values are `EG`, `1OG`, `2OG`. These remain prototype assumptions until Arian supplies the actual floor mapping. Do not silently introduce a second floor enumeration.
- Use the existing seed for the first integration. No second room catalogue or new map-room IDs.

### 2.2 Static configuration, not another API

Proposed owner/location: Arian, `src/lib/map/config.ts`; images under `public/maps/`.

```typescript
type MapFloor = {
  id: FloorId;
  image: {
    src: string;   // public asset URL, e.g. /maps/1og.svg
    width: number; // positive integer: intrinsic image/viewBox width
    height: number;
  };
};

type RoomMapPosition = {
  roomId: string;
  floorId: FloorId;
  x: number;
  y: number;
};

type CampusMapConfig = {
  schemaVersion: 1;
  floors: MapFloor[];
  positions: RoomMapPosition[];
};
```

`x` and `y` must be finite numbers in `[0, 1]`. Origin is the top-left of the **actual floor image**, x increases rightward, y downward. `(0.5, 0.5)` is its centre. Convert to image coordinates with `cx=x*width`, `cy=y*height`. Image and overlay must share one coordinate system; letterboxing, zoom or responsive scaling must transform them together. Do not position markers relative to the full viewport or to empty space around an image.

There is at most one floor entry per `id` and one position per `roomId`. A position is an anchor point, not a polygon or route. Arian may draw room shapes, but their selection must resolve to this same room identity. No GPS, pathfinding API, map editor or map database table is required.

### 2.3 Validity and changes

Display a marker only when all conditions hold:

1. Its room exists in the active public room response.
2. `position.floorId === room.floorId === selectedFloorId`.
3. That floor has a configured image and valid dimensions.
4. Coordinates are valid and the room has no duplicate position entry.

If Katja changes a room's floor, the old position becomes invalid. **Do not copy its coordinates to another floor.** Hide the marker and show a localized "Position not available" in the selected room details; keep the room's schedule link available. Arian corrects the configuration in a later reviewed change. Archived/unknown rooms cannot remain selected or expose a stale marker.

Changing the floor manually clears the selected room and its query parameter. On a direct room link, the current API room determines its floor; a conflicting `etage` parameter is ignored. If a room becomes invalid while open, clear its highlight and show a clear message. Reuse the existing 5-second public refresh pattern; on network failure keep last known data visibly stale, not silently current.

### 2.4 Routes and link parameters

| Purpose | Contract |
| --- | --- |
| Map page — proposed | `/map?etage=1OG&raum=<roomId>&lang=en` |
| Existing daily schedule page | `/schedule?datum=YYYY-MM-DD&raum=<roomId>&lang=en` |
| Booking page — proposed | `/booking?datum=YYYY-MM-DD&raum=<roomId>&lang=en` |
| Existing rooms API | `GET /api/public/rooms` |
| Existing schedule API | `GET /api/public/schedule?date=YYYY-MM-DD&roomId=<roomId>` |

All page parameters are optional: German is default; no date means today by Berlin/server time; no selected room means the page's room-selection view. With no valid map floor/room parameter, select the first configured floor in existing `FLOORS` order; if none exists, show an unavailable state. For an unknown direct room link, show "Room not available" and allow another selection.

Use `publicHref` for public links. Preserve language and any explicit selected date across map/schedule/booking links; the map accepts optional `datum` solely as link context. Floor controls retain `datum`/language but drop `raum`. A missing date continues to mean today, not an invented fixed date. The public pages use German parameter names; the APIs keep their existing English parameter names.

Map room details link to "View schedule". Show "Book room" only for an active room with `reservable=true` **after the booking route is implemented**, never as a dead button.

## 3. Booking — proposed persistent model

### 3.1 Small prototype policy (approval item B1)

These are **course-demo defaults, not university rules**. Keep them in one server-side policy definition and return them to the UI:

| Policy | Proposed value |
| --- | --- |
| Time zone | `Europe/Berlin`; persist UTC ISO strings |
| Bookable dates | Today through today + 13 Berlin calendar days (14 dates) |
| Window | 08:00–20:00 each day, including weekends |
| Start/end grid | 15-minute Berlin wall-clock boundaries |
| Duration | 15–120 minutes, same Berlin day, entirely inside the window |
| Past time | A new start must not precede the server clock |
| Room | Exists, active, `reservable=true` |
| Accounts / identity | No student login, name, email, payment or university connection |

Use existing Berlin conversion/calendar helpers, including DST handling. Durations are elapsed minutes between UTC instants. Invalid/nonexistent local times are rejected. Availability is advisory; creation revalidates against current server data. A day with no remaining valid slots returns an empty free list, not an error.

### 3.2 Stored record and minimal receipt

```typescript
type BookingStatus = "confirmed" | "cancelled";
type BookingReceipt = {
  id: string;
  roomId: string;
  startsAt: string; // UTC ISO
  endsAt: string;   // UTC ISO
  status: BookingStatus;
};

type AdminBooking = BookingReceipt & {
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  room: {
    id: string; code: string; name: string;
    floorId: FloorId; archived: boolean;
  };
};
```

Use a new SQLite table in the **existing database**, with a foreign key to `rooms.id`, unique `request_id`, UTC times, status, created/updated/cancelled timestamps and a hash of a cancellation token. Retain cancelled rows; do not duplicate rooms or class sessions. Add a new migration; never edit old migrations. Admin list responses can include timestamps and the resolved room, but never token/hash fields.

### 3.3 Creation, retries and cancellation possession

Before submission, the browser generates `requestId` (16 random bytes, base64url without padding) and `cancelToken` (32 random bytes, base64url without padding) with `crypto.getRandomValues`, which also works for the supported HTTP demo. Both remain the same across retries of that exact submission. Validate canonical base64url encoding/decoded lengths on the server. Store neither in URLs, cookies, localStorage nor sessionStorage. Do not log them. Server stores only a SHA-256 hash of the token and compares fixed-length hash bytes with a timing-safe comparison; token/hash is not in any GET response. This is a controlled course prototype, not an Internet-facing production booking service.

Why client-generated: a lost creation response can be retried without making another booking or losing the cancellation secret; no encrypted secret store or email recovery is needed.

Inside the write transaction, a known `requestId` with matching normalized room/time data **and** matching token hash returns the same booking and its current status (200, `replayed:true`), before new-booking temporal/bookability checks. Reuse with different data/token returns 409 `request_id_reused`, revealing no booking. A new request returns 201, `replayed:false`. For a deliberate new booking/change of selection, generate new values.

After success, show the booking ID plus the token already held by the browser. The user must save them to cancel from another device. Missing credentials do not grant public cancellation; Katja can cancel through the authenticated admin route. No public booking lookup/list by ID.

The proposed `/booking/cancel` page is reachable from `/booking` and the receipt through a localized "Cancel a booking" link. It contains manually entered booking-ID and cancellation-token fields, plus an explicit confirm button. It calls the cancellation endpoint directly; there is no preliminary public lookup. Credentials never enter page query parameters or web storage. After success or leaving this page, clear both fields and its result; an error permits correction/retry without falsely claiming cancellation. Use the same `PublicShell`, language and home path as the booking page.

Public cancellation requires the booking ID and `Authorization: Bearer <cancelToken>`. Missing/malformed credentials return 401; unknown ID or wrong token returns the same 404 `not_found`. A valid token cancels a confirmed booking while `endsAt > serverTime`, including a currently running booking; repeated cancellation returns 200 with the cancelled state. A confirmed ended booking returns 409 `booking_ended`. No editing or reinstatement endpoint in MVP.

### 3.4 Proposed API surface (not implemented)

| Method / path | Input | Success |
| --- | --- | --- |
| `GET /api/public/availability` | Required `roomId`, `date=YYYY-MM-DD` | 200: availability below |
| `POST /api/public/bookings` | `{roomId,date,startTime,endTime,requestId,cancelToken}` | 201 new / 200 exact retry: `{serverTime,booking:BookingReceipt,replayed}` |
| `POST /api/public/bookings/:id/cancel` | Bearer cancellation token; empty JSON body | 200: `{serverTime,booking:BookingReceipt}` |
| `GET /api/admin/bookings` | Existing session-style query: `from`, `days` (1–62, default 7), optional `roomId` | 200: `{bookings: AdminBooking[]}` |
| `POST /api/admin/bookings/:id/cancel` | Existing admin cookie + origin check, empty JSON body | 200 receipt; same cancellation-state rules, no public token required |

`date`, `startTime` and `endTime` use the same Berlin input format as the existing session form. Booking mutation routes require JSON, bounded body validation and the existing same-origin check, but **not** the admin cookie. Admin routes retain both existing protections. Every new API response is `Cache-Control: no-store`. Do not expose admin APIs to the kiosk or broaden CORS.

Availability response shape:

```typescript
type Interval = { startsAt: string; endsAt: string }; // UTC ISO
type AvailabilityResponse = {
  serverTime: string;
  date: string; // Berlin calendar date
  timeZone: "Europe/Berlin";
  room: PublicRoom; // existing public type
  policy: {
    opensAt: "08:00"; closesAt: "20:00";
    stepMinutes: 15; minDurationMinutes: 15; maxDurationMinutes: 120;
    horizonDays: 14;
  };
  window: Interval;
  busy: (Interval & { kind: "class" | "booking" })[];
  free: Interval[];
};
```

`busy` contains only intersecting scheduled classes and confirmed bookings, clipped to the day window, ordered by start/end. No booking IDs, user identities or secrets. Calculate `free` as the complement of the union of busy intervals inside the window, trim starts against server time for today, and round free starts up/ends down to the 15-minute grid. Drop intervals shorter than 15 minutes. Free intervals may be longer than 120 minutes; individual selections must satisfy the duration limit. Read room and occupancy in one database snapshot. No reservation hold is created by this GET.

Error envelope follows existing `{error,message,fieldErrors?}`. Public UI translates stable error codes/field names using the current DE/EN mechanism; do not rely on German server message text for the English UI.

| Status | Codes / meaning |
| --- | --- |
| 400 | `validation`: invalid creation JSON, including its token format, or invalid availability date/roomId/policy input; field errors |
| 401 | `unauthorized`: missing/malformed cancellation bearer; existing admin login rule for admin APIs |
| 403 | `forbidden_origin`: mutation from another origin |
| 404 | `not_found`: inactive/unknown room; unknown booking or incorrect cancellation credential |
| 409 | `room_not_reservable`, `time_conflict`, `request_id_reused`, `booking_ended` |
| 503 | `temporarily_unavailable`: database lock timeout/unavailable storage; do not claim success |

For public `time_conflict`, expose only `{conflict:{kind,startsAt,endsAt}}`; no IDs/token information about another booking. A stale availability result never overrides a 409. Keep selection, show the localized conflict, refresh availability and require a fresh explicit confirmation for another interval. For an uncertain network result, retry the **same** creation request and credentials, not a new booking.

## 4. One occupancy invariant for bookings and Katja

For the same room, active intervals overlap iff:

```text
existing.startsAt < proposed.endsAt AND existing.endsAt > proposed.startsAt
```

Intervals are half-open `[start,end)`: 10:00–11:00 and 11:00–12:00 are allowed. Cancelled records never block time; no recurring booking/buffer/priority override in MVP.

All occupancy-changing operations use one shared occupancy check and a SQLite **IMMEDIATE write transaction** around reading current state, checking and writing. Use a single connection/transaction context for each operation; do not nest independent BEGINs or check outside the transaction. The existing deferred class-only transaction does not yet implement this cross-module requirement. SQLite lock contention can fail; honour the existing busy timeout, roll back failed writes and return the defined retryable error rather than silently accepting a conflict. See [SQLite transaction documentation](https://www.sqlite.org/lang_transaction.html).

| Operation | Required guard |
| --- | --- |
| Create booking | Active/reservable room; policy; no scheduled class or confirmed booking overlap |
| Create scheduled class | No scheduled class or confirmed booking overlap |
| Edit scheduled class, including room change | Same check, excluding its own class ID; consider new room/time |
| Reinstate cancelled class | Same check before restoring scheduled state |
| Edit a still-cancelled class | No new occupancy; check again if later reinstated |
| Cancel class/booking | Release occupancy atomically; keep record |
| Archive room | Refuse while scheduled classes **or confirmed bookings** with `endsAt > now` remain |
| Set `reservable=false` | Refuse while confirmed bookings with `endsAt > now` remain; Katja explicitly cancels them first |
| Rename room/change code/floor | Preserve IDs and booking/session references; floor mismatch invalidates map position as in §2 |

If a class change conflicts with a booking, reject the change with 409 `booking_conflict`, explain it in the admin and preserve both old records. Katja can cancel the booking explicitly, then retry. Do not silently cancel/move a booking or overwrite it because a class has priority. Retain existing `room_conflict` responses for class-vs-class conflicts; add the new error without breaking existing fields. Extend `room_in_use` with booking information for archive/disable refusals.

Manual blocked-time management, booking rescheduling, admin creation and student identities are deferred. Existing classes block availability. A future block module would join this same invariant; do not mislabel a maintenance block as an official class.

## 5. Newcomer MVP and public integration

**Proposal for Reza's confirmation:** `/newcomers`, with static plain-text DE/EN cards in `src/lib/newcomers/content.ts`; no new database table, API or admin form.

```typescript
type LocalizedCopy = { de: string; en: string | null };
type NewcomerCard = {
  id: string; // stable content slug
  title: LocalizedCopy;
  body: LocalizedCopy;
  roomId?: string; // existing room, never another room record
};
```

Reuse language/fallback helpers and shared public components. Where a card references an active room, offer `/map?raum=<id>` with the current language. If the room is absent/archived, keep the information card but show a localized unavailable location rather than linking to a wrong position. Record sources/verification of contacts in Reza's documentation; do not invent official services, contacts or opening times. Clearly label any demo text. Editing static content through Git is sufficient for this MVP; an admin editor is a later separate decision.

Use the existing `PublicShell`, `PublicNav`, `publicHref` and DE/EN text mechanism. New routes enter the same navigation registry once their pages exist; no independent menu system or admin links. Keep existing routes and their behaviour reachable. The visual arrangement/number of tabs is a later UI decision; this contract does not require cramming every page into the current four-column bar.

## 6. Ownership and integration boundary (confirmation required)

| Member | Own deliverable | Shared changes / acceptance boundary |
| --- | --- | --- |
| Arian | `src/app/map/`, `src/lib/map/`, map assets and map tests; actual floor/room mapping | Consume existing room API; propose navigation/language additions for Ali's review; no second room backend |
| Parsa | Booking repository/schema/API, public booking/cancel UI, minimal admin list/cancel view and booking tests | Propose shared occupancy helper and narrow class/room guard changes as a coordinated PR reviewed by Ali; no replacement schedule/room system |
| Reza | Newcomer content/page/tests plus measured screen information | Confirm static-content MVP and provide sourced content; use existing public frame/IDs; no admin CMS obligation |
| Ali | Existing admin/data contract stewardship, shared navigation/language/service wiring and integration review | Coordinate migration ordering and shared-file edits; accept/review members' PRs; not responsible for implementing their modules |

Proposed shared occupancy location: `src/lib/occupancy/`. Parsa proposes the implementation; Ali reviews its use by current session/room repositories. Changes to `src/lib/server.ts`, migrations, existing repositories and shared navigation are agreed before editing. Use the next available migration after coordinating with Ali, not an assumed number in parallel branches.

### Kiosk cancellation receipt (approval item B2)

Receipt credentials remain only in component memory and are cleared on leaving the receipt or pressing "Finish"; never place them in browser history or web storage. Proposed receipt behaviour: visible 60-second countdown, "More time" restarts it, expiry clears the receipt and returns to the start page in the current language. This applies only to the receipt, not an unfinished booking form. Confirm this small policy with Reza; a general kiosk idle reset is still separate. Frontend clearing does not revoke the saved token; the user can cancel later with their saved copy. The shared screen's browser Back must not reveal a cached receipt.

## 7. Required acceptance checks — planned, not test results

| Area | Check |
| --- | --- |
| Map | Marker stays aligned when resized; changing floor clears selection; renamed room remains linked; floor mismatch/archive/unknown room hides stale position; language/date/room links remain correct |
| Booking | Successful creation and cancellation; identical retry returns same ID; changed payload/token with reused ID rejected; wrong cancellation token denied; cancelled/ended states handled |
| Cancellation UI | Open `/booking/cancel` in a fresh browser context, manually enter the saved ID/token and cancel; missing/malformed bearer is 401, well-formed wrong token is 404; credentials never appear in URL/storage and are cleared after success/navigation |
| Conflict | Booking-vs-booking, booking-vs-class, class create/edit/reinstate-vs-booking; adjacency allowed; changing room considered; rejected write preserves prior state |
| Concurrency | Two overlapping creates on separate DB connections cannot both commit; booking racing class create/update also cannot leave overlapping active records; controlled successful/409 outcomes and retryable lock errors covered |
| Room lifecycle | Archive and disabling reservations refused with active future/current bookings; renaming preserves references |
| Availability | Berlin date/window/horizon, past time, empty day, clipping/union/grid, cancellation frees time; response contains no private IDs or secrets |
| Newcomer | DE/EN/fallback, home return, active/archived room links; sourced/demo content distinguished |
| Integration | Existing announcement/room/session tests remain valid; new paths reachable by clicks from `/`; no public admin link |
| Devices / HCI | Real second-device/screen tests and representative user observations recorded only when actually performed; automated tests do not substitute for them |

No runtime code changed for this proposal, so no new build/E2E/unit results are claimed. At implementation, run relevant tests plus the existing required repository checks; preserve before/after evidence for regressions.

## 8. Decisions ready for explicit confirmation

| ID | Concrete recommendation | Confirmation still needed |
| --- | --- | --- |
| M1 | Static normalized map configuration in §2; reuse existing room APIs and seed IDs | Arian: agree format and supply actual image/floor mapping; Ali: shared contract review |
| B1 | SQLite booking with the limits in §3.1 and API/token/retry rules in §3 | Persistence confirmed by Ali; Parsa/Ali confirm the detailed defaults and endpoint contract |
| B2 | Conflict rejection instead of automatic cancellation; shared atomic guard; small receipt timeout in §6 | Parsa/Ali confirm guard integration; Reza confirms receipt behaviour |
| N1 | Static newcomer page/cards; no admin editor for MVP | Reza/Ali confirm scope |
| I1 | Ownership table and shared-file review boundary | All four members confirm their own responsibilities |

Dates/limits above are proposed demo policy, not verified campus policy. Actual floor assets/numbers and official course deadlines cannot be invented by this contract.

### Promotion after confirmation

1. Record who confirmed each item and the date, or their concrete alternative.
2. Move accepted interfaces to `docs/contracts.md` with **Agreed / not implemented** status; preserve implemented endpoint documentation.
3. Update README/Kanban: S-1/S-2/S-3 by actual confirmation; P-1 by accepted booking policy; P-4 narrowed to list/cancel with manual blocks deferred; R-2 static MVP if Reza agrees. Keep implementation/test cards open until evidenced.
4. Preserve old decisions in the vault and add their successor; do not mark all team work Done because this proposal exists.
5. Prepare each member's implementation plan within their own module. Do not start their code or publish this draft to main on the assumption that all members agreed.
