# PARSA | LCC Campus Board – Room booking integration candidate

**Status:** Code package prepared 29 Oct 2026. Not yet merged into Ali's GitHub repository. The existing `docs/contracts.md` labels booking B1 and kiosk receipt B2 as **proposed**; confirm rules with Parsa, Ali, Reza before merging. A public demo reservation is **not** a real university booking.


## FINAL pilot alignment – floorplan-derived demo rooms (29 Oct 2026)

The team supplied three Hochschul floorplan images. Four legible room labels are used for an **optional, non-official demo only**:

| Room code | Floor | Label | Reservable in demo? |
| --- | --- | --- | --- |
| K1-103 | 1.OG | Seminarraum 1 | assumed yes |
| K1-120 | 1.OG | Seminarraum | assumed yes |
| K1-210 | 2.OG | Seminarraum | assumed yes |
| K1-303 | 3.OG | Seminarraum 8 | assumed yes |

No university permission to reserve these rooms is implied. The new opt-in command `node scripts/seed-parsa-demo-rooms.ts` inserts them only when a room with that code does not already exist. It never changes existing room data. **Use only a disposable/demo database**, never the campus production database. Existing demo records from `npm run db:seed-demo` remain untouched.

**Floor 3 integration:** `apply_to_repo.py` now also updates `src/lib/rooms/schema.ts`, `src/lib/i18n/public.ts` and `src/components/public/PublicNav.tsx`; registration preserves the existing `EG`, `1OG`, `2OG` ids and adds `3OG`. Aryan's map component and floor geometry must be reviewed separately; booking uses stable database room IDs, not room numbers, to avoid fragile links.

All existing HCI evidence PDFs are separate research artifacts, not proof of real-user testing. The browser demo keeps bookings locally (and is not connected to SQLite). The app package uses SQLite in Ali's main Next.js system. Review network security/rate limiting before public deployments.

## Included code

New files are in `add/`:

- `src/lib/bookings/{policy,repository,http}.ts` – Berlin-time B1 policy; atomic SQLite booking+class overlap checks; token hashing; retry idempotency; availability/cancellation
- `src/app/api/public/availability/route.ts` – read-only slots
- `src/app/api/public/bookings/route.ts` – create booking
- `src/app/api/public/bookings/[id]/cancel/route.ts` – bearer-token cancellation
- `src/app/api/admin/bookings/route.ts` – admin-authenticated listing (API only)
- `src/app/api/admin/bookings/[id]/cancel/route.ts` – admin-authenticated cancellation (API only)
- `src/app/booking/{page.tsx,cancel/page.tsx}` – DE/EN public kiosk pages
- `src/components/public/BookingFlow.tsx` – full reservation and cancel UI with 60-second receipt timeout (B2 proposal)
- `tests/unit/bookings.test.ts` – tests to run in Ali's repo.

`apply_to_repo.py` also safely modifies *existing* files needed for a truly integrated feature:

- Append `room_bookings` DB migration (no existing migration changed).
- Register booking repository in `services()` using the same SQLite DB.
- Make class create/edit/reinstate check active bookings inside their existing transaction.
- Make room archive and `reservable=false` reject active upcoming bookings.
- Add booking links on public home and room directory pages.
- Add 3.OG floor, DE/EN section title, and shared navigation item (without changing other floor IDs).
- Add an **optional** demo-only room seed script for K1-103, K1-120, K1-210, K1-303.

**Important:** Admin booking *API* is provided but **no new Admin UI**. Ali may choose to add a booking list UI separately. We did not add login/SSO, actual campus integration, payment, email, blocked-time CMS, or recurring bookings.

## Installation for Ali (not Parsa)

1. Confirm B1 policy and B2 receipt behavior with team. Back up local work and ensure Git is clean.
2. Checkout latest project `main` (if you already have local work, save/stash it appropriately):

```bash
git switch main
git pull --ff-only origin main
git switch -c feature/parsa-booking
```

3. Unzip this package outside the repository; from package directory:

```bash
python3 apply_to_repo.py /absolute/path/to/kitchen-dashboard --dry-run
python3 apply_to_repo.py /absolute/path/to/kitchen-dashboard
```

   The script checks patch anchors first and refuses to replace existing new files. If it says `STOP`, **do not force it**: Ali updated a shared file, so compare and integrate manually.

4. Run in the **Ali repo**, with existing dependencies installed:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

5. Restart the Next.js server so SQLite migration 4 is applied. With local demo DB (do **not** commit SQLite file, `.env.local` or secrets):

```bash
npm run db:seed-demo
node scripts/seed-parsa-demo-rooms.ts  # OPTIONAL; demo database ONLY
npm run dev
```

6. Ensure one room has `reservable=true` in admin. Visit `/booking` (German), `/booking?lang=en` (English), `/booking/cancel`. Inspect demo reservations with `GET /api/admin/bookings` while authenticated. Check:
   - booked slot blocked for another booking;
   - `scheduled` class blocked from overlapping a confirmed booking;
   - creating booking on a scheduled class is blocked;
   - cancelling with ID + token frees slot;
   - admin cannot archive/disable reservability for a currently active booking;
   - after restarting, reservation persists.

7. Review `git diff`; create Pull Request, request Ali review. **Never force-push or merge automatically**.

## API summaries

- `GET /api/public/availability?roomId=<opaque id>&date=YYYY-MM-DD` → `{serverTime,date,timeZone,policy,window,room,busy,free}`
- `POST /api/public/bookings` body `{roomId,date,startTime,endTime,requestId,cancelToken}` → `{booking,replayed}`, 201/200. A browser must set a same-origin `Origin` header.
- `POST /api/public/bookings/<uuid>/cancel`, `Authorization: Bearer <cancelToken>` → `{booking}`. Secret is NOT stored in DB and is NOT returned by API.
- `GET /api/admin/bookings?from=YYYY-MM-DD&days=7&roomId=...` → authenticated `{bookings}`.
- `POST /api/admin/bookings/<uuid>/cancel` → authenticated admin cancellation.

## Scope and security notes

- Demo policy assumed: 08:00–20:00, 14 calendar days inclusive, 15-minute grid, 15–120 min, Europe/Berlin, UTC persisted. **Not confirmed university rules.**
- Uses 16-byte random request IDs, 32-byte random cancellation tokens generated client-side; DB stores only SHA-256 hash. Client keeps secret only in React memory (never URL/storage).
- Receipt auto-clears after 60 s; **Reza must confirm B2** and ideally test the physical kiosk. Public-kiosk privacy is not the same as real-world security certification.
- This is an anonymous public demo write API; before exposing it on the public internet, Ali must review abuse/rate-limiting and network/access restrictions. Prefer local/offline classroom demo.
- SQLite collision checks are atomic under `BEGIN IMMEDIATE` for new bookings. Existing class mutations are checked in their transaction. Final concurrency verification must run against actual integrated project and at least two DB connections.
- `docs/contracts.md` should receive a reviewed, signed booking contract **after** team approval. We have not silently edited it.

## What is not verified yet

The ChatGPT environment could read Ali's current public repo but could not clone and install its dependencies over the network, so **Next.js build, TypeScript typecheck, Vitest and end-to-end tests have not been run on the integrated app**. Source syntax checks and standalone policy/SQL checks are separate; run the commands above in the real checkout. See `docs/PARSA_HCI_EVIDENCE_TEMPLATE.md` for real-user research/test notes. Do not represent simulated results as actual user testing.
