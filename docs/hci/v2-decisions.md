# V2 decisions (T23) — analytical only, 2026-10-31

Inputs: `heuristic-evaluation.md` (HE-01…HE-08) and `cognitive-walkthrough.md` (CW-01) on `integrated-v1` (`64d2801`). Evaluator: Claude Code (AI) on Ali's behalf. **No participant data exists yet**; every item below is an analytical hypothesis, not a measured problem.

## Decision on timing

V1 stays frozen for the first human round (T22): changing the UI now would mean the people test a different version than the one documented. V2 implementation (T24) therefore waits for at least one real session, unless Ali decides otherwise. This is a sequencing choice, not a blocker on technical work.

## Ranked candidates (wrong outcome/blocker > confusion > friction > cosmetic)

| Rank | ID | Problem (analytical) | Proposed change | Alternative | Expected benefit (hypothesis) | Accept / retest |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CW-01 | Schedule of a room has no way to book it; user must go back | Add "Diesen Raum reservieren" to the schedule room header when reservable (keeps `raum`, `datum`, `lang`) | Rely on map/room list | Shorter path for U3 | E2E link test; U3 observation |
| 2 | HE-06 | Receipt may disappear before the code is noted | Decide after U3/U4: longer default, or shorter human-readable code (would change the API contract) | Keep 60 s + More time | Fewer lost codes | Count codes noted successfully in U3/U4 |
| 3 | HE-03 | Small, overlapping map markers at narrow width | Larger markers when zoomed; list filtered to search result first | Keep list as fallback | Fewer mis-taps | Real-screen measurement (T20), U2 |
| 4 | HE-01 | Two stacked demo notices push the booking form down | Merge into one notice | — | Less reading before the task | Screenshot; U3 |
| 5 | HE-02 / HE-05 | Repeated nav + tiles; long time list | Revisit with real screen size; group times by hour | — | Lower scanning load | U1/U3 |

Deferred / not proposed: new colour palette (no usability evidence), animation, accounts, any feature beyond the listed problems. HE-07 accepted as a documented prototype limitation. HE-08 depends on Reza's facts (T21).
