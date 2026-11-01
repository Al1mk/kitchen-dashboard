# Human work, evaluation and delivery kit

Prepared, **not performed**. Claude may copy/adapt these templates into `docs/hci/`; actual human/device results need genuine input.

## Who must do what

| Person | Human-owned follow-up | What Claude can do |
| --- | --- | --- |
| Ali | Review runnable integration, actual admin experience, team provenance clarification and current Moodle requirements | Prepare demo, tests, contribution ledger, questions and report draft |
| Aryan | Clarify map source/floor/room accuracy; supply any actual user observations/sketch dates | Preserve/import source, fix integration, prepare map test cards |
| Aryan/Parsa | Clarify joint contribution; review booking assumptions; conduct student booking tasks | Fix code, prepare recording sheet and summarize genuine results |
| Reza | Inspect physical screen; establish newcomer priorities and verified content; review English; assess receipt use | Prepare measurement/interview sheets, integrate static copy and sourced data |
| Volunteers / Katja or identified proxy | Perform tasks without being coached through UI | Claude cannot substitute or manufacture these observations |

The joint contribution remains joint unless members provide a more precise account. These are proposed next responsibilities, not claims about work already completed.

## Three joint proto-personas

Create `docs/hci/user-research.md` with these role hypotheses. Do not invent ages, quotes, biographies or interview support.

| Role | Goal / assumed pain | Context / questions to check |
| --- | --- | --- |
| Current student | Find a specified room/class and reserve a free demo interval | Short kitchen visit; does room-first or time-first match their task? Can they recover from conflict? |
| Newcomer/international visitor | Understand first step, find destination and useful guidance in DE/EN | Unfamiliar room codes/building; can they recognize the entry and language choice? |
| Katja / administrator | Update/publish information and understand impact on public display | Laptop, interrupted work; does saved/published/conflict feedback match expectations? |

For each: hypothesis source, confidence, actual supporting/contradicting observation when supplied, resulting requirement, unresolved question. Shared role-based personas are enough; do not produce three fictional personas per team member.

## Short interview guide

Ask before showing the UI where possible. Record that the software already existed; this is follow-up research.

1. At a new campus, what information would you seek first?
2. How do you currently find a room or its class schedule?
3. What would you expect after tapping a room on a campus screen?
4. If you wanted a study space, would you start with a room or a time? Why?
5. Which language and which terms are easiest in this context?
6. What would confirm that your action succeeded? What would confuse you?

Katja/proxy: what changes most often, how would you distinguish draft and published, and what would you expect if a class conflicts with a booking?

## Device inspection sheet — Reza, T20

Record date, observer, method and `Measured / Observed / Staff-reported / Assumed / Not verified` for: location; model; physical width/height; native resolution; portrait orientation; OS/browser; touch technology if known; reachable areas/mounting height; viewing distance; reflection/light; scroll/zoom behavior; network/server reachability. Do not change university device settings without authorization. Unknown values stay unknown. A laptop test is not a campus-screen test.

## Formative usability session — T22

Suggested small round: about 3–5 volunteers across relevant roles, including a newcomer/international perspective and Katja or an explicitly identified proxy where possible. This is a practical formative suggestion, not a required or representative sample. One observation is useful if honestly labeled; do not fabricate more to meet a number.

Suggested introduction: “We are testing the design, not you. Participation is voluntary and you can stop. We will take anonymous notes, with no names or recordings unless separately agreed. Is that okay?”

Give goals, not click instructions. Use a demo dataset known to support the task. Read each card individually, allow exploration, and record assistance. If intervention is necessary, record it rather than counting the task as unaided success.

| Task card | Goal | Observe |
| --- | --- | --- |
| U1 — Newcomer | “You are new here. Find where you would look for tomorrow's class and its room. Use English if you prefer.” | Entry choice, label understanding, language, return path |
| U2 — Map | “Find K1-120 in this demonstration, then check its schedule tomorrow.” | Search vs floor choice, marker meaning, selected-room consistency, missing-position recovery |
| U3 — Booking | “Reserve that room tomorrow for one free hour. Show how you know it worked.” | Room/time/review comprehension, pending feedback, success interpretation |
| U4 — Recovery | “Cancel your demonstration reservation using the details you saved.” | ID/code burden, discovery of cancellation, errors, confirmation |
| U5 — Katja/proxy | “Prepare a notice for tomorrow, preview it in both languages, publish it and check the public result.” | Draft vs publish, preview purpose, visible confirmation |
| U6 — Katja/proxy recovery | “A proposed class time conflicts with a demo reservation. Show what you would do.” | Explanation, preserving previous state, explicit cancellation/retry |

U2 assesses interaction on the supplied illustration until actual building accuracy is verified. Do not claim that it proves successful navigation through the real campus. Keep deliberately invalid-input exercises separate from discovery tasks; do not coach users into noticing a specific error message.

## Record per task

Create `docs/hci/testing/session-template.md` and dated anonymous records with:

- Actual date; facilitator; anonymous participant code and role; consent; language.
- Exact app version/commit and dataset; actual device/viewport; physical or simulated screen.
- Task; success unaided / assisted / partial / not completed; assistance given.
- Observed actions, hesitation and errors; time only if actually measured.
- Optional non-identifying quote with permission; evaluator interpretation in a separate field.
- Problem ID; severity and rationale; proposed change; actual implementation reference; retest result or NOT RUN.

Do not put names, contact details, session cookies, cancellation secrets or identifiable screenshots in the public repo. Do not send invitations/messages automatically; Ali/team arrange participants. Prepared forms and scripts are not participant responses.

## Shared analytical review — T18/T23

Create `docs/hci/heuristic-evaluation.md`: evaluator/date/version, Nielsen principle, concrete issue, screen/step, proposed fix, evidence, severity and verification. Use one small shared report.

Create `docs/hci/cognitive-walkthrough.md`: for each step ask the course p.129 questions: is the right action clear, can it be recognized/found, and is feedback sufficient to recognize success? Label answers as evaluator judgments, not participant results.

Suggested prioritization: 3 = prevents task/wrong outcome; 2 = substantial confusion or assistance; 1 = friction; 0 = cosmetic. This is a team working scale, not a professor-mandated grading rule.

## V2 selection — T23/T24/T25

Select a small number of high-impact findings supported by actual observations or explicitly labeled analytical evidence. Keep source type visible. A new color palette alone is not a demonstrated usability improvement.

| Problem | Evidence/version | Selected change and reason | Before/after | Technical result | Human retest / limitation |
| --- | --- | --- | --- | --- | --- |
| No result yet | NOT RUN | Decision pending evidence | Not captured | NOT RUN | NOT RUN |

Preserve integrated V1. Use UI/UX Pro Max and existing semantic tokens during T24 if available; a skill recommendation is a design input, not validation. No multi-skill redesign, new framework or Figma export is needed to demonstrate iteration.

## Booklet — T26

Five pages per person: four members need at least 20 pages of clearly attributed individual content, following the transcript/slide requirement. Shared introduction/method may be additional; do not hide individual contribution behind duplicated general text. Use the sample booklet as visual inspiration, not a requirement for a business plan or merchandise startup.

Suggested individual organization, not a mandatory template:

1. Problem, role, goals and actual/assumed requirements.
2. Alternative sketches, actual dates and reason for the choice.
3. The implemented prototype and personal/source/integration contribution.
4. Relevant HCI principles, concrete decisions and screenshots.
5. Actual evaluation, changes, retest, limitations and AI assistance.

Ali: admin, shared architecture/data and integration. Aryan: original map/interaction and accuracy limits. Joint booking work: attribute exact parts only when clarified; do not duplicate both individuals' entire contribution. Reza: newcomer route/design and real screen/content/test follow-up. Reza's existing five-page draft is a starting point; update its status only with genuine evidence. Never replace NOT RUN with invented success to fill pages.

## Five-minute demonstration — T27

Suggested timings, not mandatory individual speaking quotas:

- 0:00–0:30: problem, three user groups, prototype boundary.
- 0:30–2:00: find room → schedule → reserve/cancel.
- 2:00–3:00: newcomer entry and DE/EN.
- 3:00–4:00: Katja update/publish and public result.
- 4:00–5:00: actual evaluation, one or two V1→V2 changes, limitations.

Rehearse against a reproducible demo database. Keep local screenshots/video as backup, clearly identified. Validate current dates/format in Moodle; the slide's printed dates are from 2025. The old Monday Makerspace workshop is not a new task to attend on 31 October.
