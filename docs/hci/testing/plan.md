# Formative test plan (T22) — prepared, NOT RUN

Prepared 2026-10-31 by Ali with Claude Code. Humans run it; nothing here is a result.

- **Version:** `integrated-v1` (commit in `docs/hci/versions.md`), team demo database (`npm run db:seed-team-demo`, see README). Note which device: real kitchen screen, second device, or laptop in a simulated portrait window.
- **Participants:** a small round, e.g. 3–5 volunteers across the three roles, incl. one newcomer/international perspective and Katja or a named proxy. This is a practical suggestion, not a representative sample. One honestly recorded session is better than invented ones.
- **Introduction:** "We are testing the design, not you. Participation is voluntary and you can stop. We take anonymous notes, no names or recordings unless agreed. Is that okay?"
- Give goals, not clicks. Record any help given. Time only if actually measured.
- The map is an illustration: U2 tests the interface, not navigation in the real building.

| Card | Goal said to the participant | Observe |
| --- | --- | --- |
| U1 Newcomer | "You are new here. Find where you would look for tomorrow's class and its room. Use English if you prefer." | Entry choice, labels, language, way back |
| U2 Map | "Find K1-120 in this demonstration, then check its schedule tomorrow." | Search vs floor, marker meaning, consistency, small markers |
| U3 Booking | "Reserve that room tomorrow for one free hour. Show how you know it worked." | Review step, pending state, success understanding, noting the code within the countdown |
| U4 Recovery | "Cancel your demonstration reservation using the details you saved." | Finding cancel, ID/code burden, errors |
| U5 Katja/proxy | "Prepare a notice for tomorrow, preview it in both languages, publish it and check the public result." | Draft vs publish, preview purpose |
| U6 Katja/proxy recovery | "A proposed class time conflicts with a demo reservation. Show what you would do." | Understanding the conflict, using the list link, retry |

Severity scale (team working scale): 3 = wrong outcome / task blocked; 2 = substantial confusion or help needed; 1 = friction; 0 = cosmetic.

Do **not** store names, contacts, cookies, cancellation codes or identifiable photos in the repository.
