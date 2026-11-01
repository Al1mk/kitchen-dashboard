# Parsa | HCI documentation & user test worksheet

**Use this as a template. Do not claim the below to be performed.**

## Scope / user task
A student wants to reserve one available room on the shared portrait touchscreen, without account login. The prototype uses demo dates, rooms and stored reservations in a local SQLite DB. No official Hochschulraum-Berechtigung is granted.

## Design alternatives (Sketch)
- Sketch A: Room first → date → available time → review → confirm. **Implemented candidate.**
- Sketch B: Date/time first → list of matching rooms → review → confirm. **Not implemented; compare with users.**

Keep dated photos of real sketches; do not claim drawings created earlier than they were.

## HCI rationale
| Concept | In the design | Evidence to capture |
| --- | --- | --- |
| Fitts' Law | 56–64 px minimum touch controls and roomy time tiles | Screenshot showing button sizes |
| Mapping | Clear selected room, date, start and end before confirm | Screenshot of review |
| Konsistenz | PublicShell, shared brand and navigation | Side-by-side screenshots |
| Feedback | Explicit success, conflict and network-error states | Actual screenshot of responses |
| Fehlervermeidung | No free slots at occupied times; server verifies again | Test overlap, API result |
| Fehlertoleranz | Cancellation with booking ID & token | Test cancellation |
| Datenschutz / kiosk | Receipt clears after 60 s; no secret in URL/storage | Inspect UI/storage and security review |

## Real user test (fill with observations only)
**Date:** [date]  **Tester role:** [anonymised student/newcomer/admin proxy]
**Environment:** [laptop/touchscreen portrait]  **Version/Commit:** [SHA]
**Task (no click-by-click hints):** "Reserve a free room tomorrow for one hour, then cancel it."
**Completion:** [success/partial/failed/not tested]
**Observed actions & hesitation:** [facts, not interpretation]
**Participant quote, only with consent:** [optional]
**Researcher's interpretation:** [label as interpretation]
**Problem ID:** [HCI-PARSA-001]
**Change V1 → V2:** [actual code/design change and link]
**Retest result:** [actual observation/not done]

## AI use disclosure example (adapt to reality)
"Für einen ersten Codeentwurf des Demo-Raumbuchungssystems nutzten wir ChatGPT. Die vorgeschlagenen Dateien wurden anhand des vorhandenen Team-Repositories geprüft, überarbeitet und durch technische sowie menschliche Tests validiert, soweit dokumentiert." Do not claim validation you did not perform.

## Personal 5-page booklet layout suggestion
1. Users, context and booking goals
2. Alternative sketches, flow and design rationale
3. Real implementation, data and screenshots, what is demo
4. HCI principles, errors, security/privacy constraints
5. Recorded real testing, actual V1→V2 changes, limitations and AI use
