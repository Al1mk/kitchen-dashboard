# Room, person and course search — requested follow-up

Recorded **1 November 2026** from Ali's request during his local review. **Status update (same day, afternoon): T32 implemented and technically verified; the classroom part of T33 implemented and technically tested; office/staff lookup and T34 still open** — see [implementation and evidence](#implementation-1-november-2026). This records a team requirement, not an independent participant study or a measured UX improvement.

## Independent review follow-up — 1 November 2026

T32 is reopened to **IMPLEMENTED**, pending [SEARCH-R001](../../reviews/2026-11-01-room-search-review.md): same-page history/navigation overwrites the previous query/day with current local state. Core matching and lecturer corrections remain present; T33 stays IN_PROGRESS and T34 WAITING_HUMAN. Original implementation/test records below are retained; they did not cover this additional sequence. No fix has been applied by the reviewer.

## Existing behaviour

- `CampusMap.tsx` already searches active rooms by code, German name and English name. Preserve it and reuse its matching where appropriate.
- `RoomDirectory.tsx` (`/rooms`) listed rooms by floor without a search input (search added 1 November, see below).
- Sessions contain `title`, `instructor` and stable `roomId`; there is no structured staff/office directory or person/course search. A class's room is not automatically its lecturer's office.

## Ordered to-do list

### T34 — Confirm people and room labels [P1, human input]

- [ ] Check the campus facts in the table below with Reza/Aryan and on-site signage or the relevant campus contact. Record source and date. Ali's uncertain recollection is not a verified assignment.
- [ ] Confirm Katja's full name and the secretariat's actual room code; confirm whether Christian Grosch's room is adjacent. No full name or adjacency is inferred from the map drawing.
- [ ] Resolve Christian Grosch's office: Ali recalls **possibly K1-105**, the supplied demo catalog calls K1-105 **EDV / IT room**, while the official campus-team page lists **K1-211**. Keep all three provenance records; do not overwrite data before resolving the discrepancy.
- [ ] Prepare the requested public label **Küche / Kommunikationsbereich** and **Kitchen / communication area** for the area Ali identifies as the current communication area. Confirm that this refers to catalog K1-108 before applying it. Preserve the separate K1-212 tea kitchen and the separate base-demo kitchen unless explicitly confirmed to be the same physical place.
- [ ] After confirmation, correct shared room records by their existing IDs and any intended fresh-demo seed values; preserve map geometry/links, source imports and existing data. Existing seeds do not update edited records, so a seed-only change is not enough for an existing demo DB.

### T32 — Add room search to the room directory [P1]

- [x] Add a clearly labelled, touch-friendly search input to `/rooms`, for room code and DE/EN room name; reuse existing map behaviour instead of building another directory/database.
- [x] Support partial text, case-insensitive matching and code variants such as `K1-105`, `K1 105` and `105`; keep `room.id` as identity. Verify how spaces/punctuation are normalized rather than copying edge cases blindly.
- [x] Provide clear/reset and a useful no-results state; keep floor grouping, room-map/schedule/booking links, language, active-room rules and German-fallback labels.
- [x] Test relevant search/link behaviour in both languages, including keyboard/touch interaction and an archived room; record real outcomes. No automatic room replacement when a search has no match.

### T33 — Search by lecturer/staff name or course [P1]

- [ ] Agree the smallest source of truth for person aliases and confirmed office-to-room-ID mappings; reuse sessions for course/lecturer/date results. Avoid a separate staff-management system or duplicate room records.
- [ ] Recognize verified names/approved aliases: `Christian Zagel`, `Chris`, `Zagel`, `Christian Grosch`, and `Katja` once her correct public record is confirmed. A broad query such as `Christian` must show all matches rather than silently picking one person.
- [ ] Support course searches such as `Mensch-Maschine-Interaktion` / `Mensch Maschine Interaktion`; use `MMI` or `HCI` only as explicitly configured aliases. Ali identifies this course with Christian Zagel; validate the actual session data before presenting it as a current timetable.
- [ ] Distinguish **office / service destination** from **classroom on a selected date and time** in result labels. Show time/date for course results and link to the right schedule/map by room ID, preserving language. Never imply live location tracking or that someone is physically present.
- [ ] Show missing-office/missing-session/ambiguous/no-results states honestly. Do not turn Zagel's Coburg office address into a K1 map position or guess a classroom from a course title.
- [ ] Verify `Chris` → the intended person, `Christian` → multiple matches, `Katja` → confirmed secretariat, course → dated sessions, missing mapping, DE/EN and changed/archived room behaviour. Technical tests and any human retest remain separate evidence.

Implementation ownership is to be agreed: Ali coordinates shared data/integration, Aryan reviews map/search links, Reza helps verify public content, and Parsa reviews schedule/booking links. This note does not assign Ali all teammate work or authorize rewriting their modules.

## Fact/provenance table

Official pages were read on **1 November 2026**. A public directory is a dated source, not proof of today's physical occupancy or a current class timetable.

| Item | Current evidence | State / next action |
| --- | --- | --- |
| Chris's full name | Official [Christian Zagel profile](https://www.hs-coburg.de/personen/prof-dr-christian-zagel/) identifies **Prof. Dr. Christian Zagel** and lists human-machine interaction among his fields | Name verified against that page; this course/term's sessions still need their own source |
| Zagel's office | The same profile gives **9-118, Friedrich-Streib-Str. 2, Coburg** | Does not establish a K1/Kronach office or classroom; do not map it into K1 |
| Christian Grosch | Official [Wirtschaftsinformatik 2.0 campus-team page](https://www.hs-coburg.de/studieren/bachelor/wirtschaft/wirtschaftsinformatik-2-0/campusteam/) names him as coordinator and lists **K1-211, Güterstraße 8, Kronach** | Source-backed listing; conflicts with Ali's tentative K1-105 and must be reconciled before a correction |
| Grosch next to secretariat, possibly K1-105 | Ali's recollection, 1 November; current catalog K1-105 is EDV / IT room | Unverified; inspect on site / ask campus team |
| Katja in the secretariat | Ali's statement; current illustrative catalog secretariat is K1-107 | Person/room association and full name unverified; the official campus-team page read here did not identify Katja |
| Communication area is kitchen / communication area | Ali's requested correction; catalog K1-108 is Kommunikation / Communication area | Requested label recorded; exact target room to confirm before changing live data |

## Implementation (1 November 2026)

Implemented by Claude Code at Ali's request on `main` at `452d893`; **uncommitted** for Ali's review. Technical checks only — no participant or human retest.

- **T32 done:** `/rooms` search field (DE/EN labels, hint, clear button returning focus, no-results message), shared matcher `src/lib/search/match.ts` also used by the map. Code variants `K1-105`, `K1 105`, `k1-105`, `105` (also partial: `105` lists K1-105 and any K1-105x); accents/umlauts (`Kueche`/`Kuche` → Küche); punctuation-only queries match nothing. Floor grouping, map/schedule/booking links by room ID and German-fallback labels stay; archived rooms are not listed (only active rooms come from the API).
- **T33 classroom part done:** for a non-empty query `/rooms` also lists classes of a chosen day (date field and previous/today/next, default today in Berlin) whose course or lecturer matches: time, course, lecturer, room, floor, "Entfällt"/"Cancelled", links to `/map?raum=<id>&datum=` and `/schedule?datum=&raum=<id>`. Labelled as the room of a class on that day, not an office or a person's location. `Chris` → Christian Zagel and `MMI`/`HCI` → Mensch-Maschine-Interaktion are configured aliases (whole query, whole word); `Christian` lists every match. Error state ≠ "no classes"; a previous day's late response is discarded.
- **HCI demo lecturer:** Prof. Dr. Christian Zagel (name source above) on the three HCI demo sessions of the two seeds; Ali's manual demo DB corrected with a backup (details in the evidence). Rooms/times remain invented demo values, not the course's timetable.
- **Still open (T33 remainder, T34):** office/staff lookup and the checkboxes above for Grosch, Katja, office mapping and missing-office states; room/label corrections incl. the kitchen rename. Nothing from the fact table was applied to data.

Evidence: [room-search-2026-11-01](../../evidence/room-search-2026-11-01/README.md).

Design rationale (analytical, not measured): visitors can *recognize* a room or course in a filtered list instead of recalling the floor and room number (recognition rather than recall); the same matching on map and directory keeps search consistent; explicit no-results, cancelled and error states give clear feedback; direct links to the right room and day reduce navigation steps. Whether this helps real visitors is untested until a human session (T22) is run.

The user's request is to **add these to the to-do list**. No app, DB, seed or source import was changed by this requirements note. At recording time T32/T33 were TODO; for the state after implementation see the progress board. T34 is WAITING_HUMAN. Current task state: [progress board](../../plans/team-integration-2026-10-31/02-progress.md).
