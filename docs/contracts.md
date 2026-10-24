# Shared contracts (M1)

For teammates (rooms/schedule, booking, newcomer content) who want to integrate or build in parallel. Only the announcement contract is implemented. Everything under "Proposed" is a sketch to agree on, **not built**.

## Implemented: announcements

Source of truth: `src/lib/announcements/schema.ts` (TypeScript types + zod validation, importable from client and server).

### Public read — `GET /api/public/announcements`

No authentication. `Cache-Control: no-store`. Returns only announcements that are published and inside their visibility window (server clock), pinned first, then newest.

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
      "endsAt": "ISO UTC | null"
    }
  ]
}
```

Drafts, withdrawn items, scheduled/expired items and admin fields never appear here.

### Admin write — `/api/admin/announcements/**`

Requires the admin session cookie; every non-GET request also needs a same-origin `Origin` header. Input times are Europe/Berlin wall-clock strings `YYYY-MM-DDTHH:mm` (or empty), stored as UTC.

| Method + path | Effect |
| --- | --- |
| `GET /api/admin/announcements` | List (admin view incl. draft, published snapshot, state) |
| `POST /api/admin/announcements` | Create draft (`requestId` optional, makes retries idempotent) |
| `GET/PUT /api/admin/announcements/:id` | Read / save draft (public output unchanged) |
| `POST /api/admin/announcements/:id/publish` | Copy draft into the public snapshot |
| `POST /api/admin/announcements/:id/withdraw` | Remove from public output, keep content |

Errors: `{ error, message, fieldErrors? }` with 400 (validation), 401, 403 (origin), 404, 409 (not publishable / not published).

## Proposed (not built, to be agreed with Arian, Parsa, Reza)

- Stable ids independent of display names: `floorId` (`"EG"`, `"1OG"`, …), `roomId` (room code as printed on the door, e.g. `"1.12"`, to be confirmed).
- Each future module gets the same split: admin write API (session + origin) and a public read projection with allowlisted fields.
- Public booking (M4) would be a separate, narrowly validated public write endpoint — never the admin API.
- Demo data must be labelled as such in content and source.
