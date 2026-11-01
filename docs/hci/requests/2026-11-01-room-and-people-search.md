# Room, person and course search — requested follow-up

Recorded **1 November 2026** from Ali's request during his local review. **PLANNED, NOT IMPLEMENTED.** This records a team requirement, not an independent participant study or a measured UX improvement.

## Existing behaviour

- `CampusMap.tsx` already searches active rooms by code, German name and English name. Preserve it and reuse its matching where appropriate.
- `RoomDirectory.tsx` (`/rooms`) lists rooms by floor but has no search input.
- Sessions contain `title`, `instructor` and stable `roomId`; there is no structured staff/office directory or person/course search. A class's room is not automatically its lecturer's office.

## Ordered to-do list

### T34 — Confirm people and room labels [P1, human input]

- [ ] Check the campus facts in the table below with Reza/Aryan and on-site signage or the relevant campus contact. Record source and date. Ali's uncertain recollection is not a verified assignment.
- [ ] Confirm Katja's full name and the secretariat's actual room code; confirm whether Christian Grosch's room is adjacent. No full name or adjacency is inferred from the map drawing.
- [ ] Resolve Christian Grosch's office: Ali recalls **possibly K1-105**, the supplied demo catalog calls K1-105 **EDV / IT room**, while the official campus-team page lists **K1-211**. Keep all three provenance records; do not overwrite data before resolving the discrepancy.
- [ ] Prepare the requested public label **Küche / Kommunikationsbereich** and **Kitchen / communication area** for the area Ali identifies as the current communication area. Confirm that this refers to catalog K1-108 before applying it. Preserve the separate K1-212 tea kitchen and the separate base-demo kitchen unless explicitly confirmed to be the same physical place.
- [ ] After confirmation, correct shared room records by their existing IDs and any intended fresh-demo seed values; preserve map geometry/links, source imports and existing data. Existing seeds do not update edited records, so a seed-only change is not enough for an existing demo DB.

### T32 — Add room search to the room directory [P1]

- [ ] Add a clearly labelled, touch-friendly search input to `/rooms`, for room code and DE/EN room name; reuse existing map behaviour instead of building another directory/database.
- [ ] Support partial text, case-insensitive matching and code variants such as `K1-105`, `K1 105` and `105`; keep `room.id` as identity. Verify how spaces/punctuation are normalized rather than copying edge cases blindly.
- [ ] Provide clear/reset and a useful no-results state; keep floor grouping, room-map/schedule/booking links, language, active-room rules and German-fallback labels.
- [ ] Test relevant search/link behaviour in both languages, including keyboard/touch interaction and an archived room; record real outcomes. No automatic room replacement when a search has no match.

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

The user's request is to **add these to the to-do list**. No app, DB, seed or source import was changed by this requirements note. T32/T33 are TODO; T34 is WAITING_HUMAN. Current task state: [progress board](../../plans/team-integration-2026-10-31/02-progress.md).
