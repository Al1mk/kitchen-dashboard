# Parsa + Aryan – combined booking/map integration (30 Oct 2026)

## Scope and provenance
- Map bundle: Aryan V12.2 original 47 markers preserved, plus a metadata-only K1-114 list entry **without a marker/coordinates**. Booking CTA and `?raum=` preselection support added.
- Booking, SQLite migrations, endpoints, conflict checks: Parsa's 29 Oct integration candidate, enhanced with room-code deep-link handling and map backlink.
- Exactly **21 codes requested by Parsa** are assumed bookable **only for a DEMO** (see `BOOKABLE_ROOMS_21.md`). `K1-103-K1-114` was interpreted as two separate room codes, not a full numeric range. K1-114 appears in the university plan but is absent from Aryan’s illustration markers, so its position is intentionally not invented.
- Map images in Aryan's package are **AI-generated design illustrations**, not verified official plans. Do not describe as emergency guidance or official maps.
- The public STATIC DEMO uses browser-only localStorage, unrelated to the Next.js SQLite database.

## Installing into Ali's repository
**Do not run on main**. Check both modules and `docs/contracts.md` with team before integrating. Create a feature branch, and run:

```bash
python3 INSTALL_COMBINED.py /absolute/path/to/kitchen-dashboard --dry-run
python3 INSTALL_COMBINED.py /absolute/path/to/kitchen-dashboard
cd /absolute/path/to/kitchen-dashboard
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

The combined installer first performs Parsa's guarded patch, then installs Aryan's map into `/map-demo`, then adds `Karte/Map` to the shared public nav. The map is served through the Next.js `/map` redirect **preserving `?lang=en` and `?raum=CODE`**, and booking opens at `/booking`.

**Important:** If the original map files already exist in Ali's repository, the installer will stop instead of silently overwriting them. In that case Ali should manually compare/merge with the already-installed map work. Never force-run both installers over existing changes.

For demo data (disposable database only), the Parsa seed script can create the 21 assumed rooms via `node scripts/seed-parsa-demo-rooms.ts`. Confirm room flags on the server; map text alone does not grant booking rights. Frontend deep links use the room's **code** `?raum=K1-103`; React resolves this to the database's stable **id** using `/api/public/rooms` and the public booking API still uses the stable id.

## Manual QA
1. Open `/map`, click K1-120, choose `Diesen Raum probeweise reservieren`; `/booking?raum=K1-120` should display K1-120 selected.
2. Search for K1-303 and verify floor 3 & deep link.
3. Select another room outside the 21-code list; there must be no booking action.
4. On booking page use map backlink, test DE/EN, confirm 15min-grid validation and same-room conflicts.
5. Book overlapping a scheduled class: reject; create scheduled class overlapping an active booking: reject.
6. Cancel by ID/token, check slot is freed; verify database persistence after restart.
7. Review third-floor schema `3OG`, nav layout in portrait kiosk, no official-map claims.

## Limitations and gates
We did **not** run a Next.js build against Ali's true checkout. This package is an installation candidate; Ali must confirm all package tests and run test exercises after integrating. The booking rules (08–20h, 14 days, 15–120 min) are provisional. The kiosk receipt timeout needs Reza's approval and touch testing. Rate-limiting and access control are out of scope for a public production deployment. No live university booking system integration exists. No real-user study data is invented.

## Exact 21-code allowlist (frontend AND backend)
The list lives in `PARSA_BOOKING/add/src/lib/bookings/policy.ts` (`DEMO_BOOKABLE_ROOM_CODES`) and is enforced in **both** BookingFlow's dropdown and repository create/availability methods. This blocks legacy reservable demo room IDs (e.g. `DEMO-101`) from being bookable through the new module even if they remain in the shared `rooms` table. The map's CTA has an equivalent allowlist. No unapproved database migration/update of real rooms is performed.

Tests include an explicit non-whitelisted reservable room rejecting GET availability and POST booking. The 21-room seed only creates/updates demo records (`is_demo=1`) and skips non-demo rooms. Any `is_demo=0` code requiring a demo reservation must be reviewed by Ali in admin.

## Source-alignment corrections (30 Oct 2026)
The team-provided Aryan ZIP is the canonical source for 47 original room entries and three AI-drawn plan images. Those source entries and image bytes were preserved exactly. The 21-code allowlist is generated from Parsa’s selection (20 catalog matches plus manually documented K1-114, which has no map coordinates). The static booking page now also uses Aryan’s bilingual catalog names and visual language. The booking button in the public room directory is shown only for whitelisted room codes; non-whitelisted `reservable` flags no longer imply booking access in this demo. The `/map` redirect retains `?lang` and `?raum`. No actual campus floor coordinates, availability, or permission was inferred.
