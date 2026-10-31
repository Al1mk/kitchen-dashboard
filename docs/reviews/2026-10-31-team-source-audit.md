# Team source audit — 31 October 2026

Status: **audited in an isolated integration candidate; not merged, committed or pushed**.

## Conclusion

The submissions contain reusable work. They are not yet a coherent, release-ready Campus Board. Keep Ali's Next.js/SQLite application and adapt the submissions to its room IDs, public navigation and language rules. Do not replace it with the standalone demos or install both copies of the map.

The temporary candidate builds successfully, passes TypeScript and all 96 unit tests. The existing browser suite has 31 passes and one failure caused by changed archive-message wording. Lint fails with one error and three warnings. Additional checks reproduced important booking and navigation defects despite those passing tests.

No runtime changes were made to the real application. Its current database was not used. The remote `main` and local HEAD were both `4ae9808edec4348f116d2d536c84eb05af151e27` when checked. Existing untracked proposal files and the Headroom lock were preserved. This report and its evidence are new, local documentation.

## 1. Inputs and contribution boundaries

Ali supplied three folders under the course's `Project/` directory:

| Submission | Content actually present | Attribution supported now |
| --- | --- | --- |
| `LCC_K1_COMPLETE_V12_2_QA_VERIFIED_aryan` | Original map delivery, independent browser demo, installation wrapper, survey templates, reported QA outputs | Original map attributed to Aryan by the submission and Ali |
| `Parsa_Aryan_SOURCE_FINAL_Fuer_Ali (2)` | Modified copy of that map, booking backend/UI, installer, room manifest, tests and documentation | Joint Aryan/Parsa submission; precise authorship of its changes is not established |
| `Reza_HCI_Final_Pack` | Newcomer page/content, standalone prototype, two design sketches, booklet draft and research/test templates | Reza's submission, as identified by Ali |

On 31 October Ali clarified that Aryan and Parsa appear to have worked together and he does not know the exact internal split. Earlier package labels describe booking as Parsa's, but those labels alone do not prove sole authorship. Use the joint attribution until the members clarify it. Names may be recorded without inventing emails; GitHub account association is a separate matter.

The source manifest hashes 67 submitted files, including archives and documents. The submissions were preserved. A temporary Python import cache created by the installer during review was removed.

### Original Aryan map

- Three illustrated floor images: `1OG`, `2OG`, `3OG`.
- 47 original room/area records: 21, 18 and 8 by floor respectively.
- Normalized image coordinates, room-code/name search, room selection, floor controls, zoom/pan, marker toggle, German/English text and missing-data/image fallbacks.
- Independent HTML/CSS/JavaScript interface. Its original Next.js page redirects to `/map-demo/index.html`.
- Survey questions, observation protocol, empty results template and a Google Forms creation script. A prepared script does not establish that a form was published or participants responded.
- Reports of 218 browser assertions and 23 additional assertions. These are supplied reports, not 241 checks independently rerun here. No original automated runner was supplied for reproducing that complete suite.

### Joint Aryan/Parsa package

- Preserves all 47 original map records field-for-field and all three image files byte-for-byte.
- Adds `K1-114` as a 48th searchable entry with **no coordinates or marker**. Its campus-plan provenance is reported in the package; that separate source plan is not included here for independent verification.
- Introduces a 21-code demo-booking allowlist; 20 codes occur in the original map.
- Adds `/booking`, `/booking/cancel`, a room/date/duration/start/review/receipt flow, cancellation form, and German/English interface copy.
- Adds a `room_bookings` SQLite migration, repository, token hashing, repeat-request handling and public/admin APIs using the existing database.
- Adds booking/class collision checks and guards against archiving or disabling a room with active bookings.
- Supplies eight new unit tests and a demo-room seeding script. The seed was **not** run against Ali's real database.
- Adds admin booking APIs, **not an admin booking list/cancellation page**.
- Mentions a browser-local booking demo and distribution directories that are absent from this particular source folder. Their functionality was not inferred from the README.

### Reza package

- Static `/newcomers` route using the current `PublicShell`, plus DE/EN content for rooms, schedule, notices and help.
- Three working destination links are defined; the help card supplies general text without an actionable contact. The map link is intentionally pending integration.
- Independent clickable HTML prototype. Its simulated room/schedule/notices panels are not additional integrated data modules.
- Two SVG alternatives: task-first versus category-first, with a proposed rationale.
- German booklet draft in Markdown, DOCX and a five-page PDF; document text was inspected. This is a draft with outstanding evidence, not a completed evaluated submission.
- Physical-screen inspection sheet, interview guide and usability-test plan/record template.
- No measured screen specifications, completed interviews or participant results in the supplied files. No automated newcomer tests were supplied.

## 2. Verification performed

Method: create a tracked-files-only copy of Ali's current application under `/private/tmp/hci-team-audit-2026-10-31/combined-candidate`. Do not copy `.env`, `.git` or `data/`. Apply the reviewed joint installer to that copy, then copy Reza's two source files. Adapt only the shared navigation/translation keys in the copy so all three modules can be evaluated together. No application bug fixes were made in the candidate.

Use the existing installed dependency versions; clone them into the candidate for the production build. Runtime probes use a new disposable database and randomly generated temporary admin credentials. No real university data or user database is involved.

| Check | Observed result | Scope / limitation |
| --- | --- | --- |
| Installer dry run and installation | Passed | Real baseline source copy; not installation into main |
| TypeScript | Passed, exit 0 | Route generation and TypeScript check |
| Unit tests | 96/96 passed, 12 files | Existing 88 plus eight supplied booking tests |
| Lint | Failed, exit 1 | One booking effect error; three unused-variable warnings |
| Production build | Passed, exit 0 | Fresh audit cache, installed dependencies and normal execution permission |
| Existing Playwright suite | 31 passed, 1 failed, exit 1 | Actual production app and temporary test database; failure explained below |
| Local production HTTP probes | Normal create/retry/conflict/cancel paths passed | Real Next.js server on loopback and a fresh SQLite file; no separate physical device |
| Standalone map browser checks | 48 entries selectable; 21 booking actions | Actual static files in Chromium; not physical accuracy of their locations |
| Booking client probes | Normal flow worked; two failure cases reproduced | Unchanged component bundled with mocked fetch and a plain-anchor replacement for Next Link; not an HTTP persistence test |
| Actual repository behavior probes | Rename/eligibility and free-span behavior recorded | New disposable SQLite database, no HTTP layer |
| Supplied `VERIFY_PACKAGE.py` | Failed | Refers to missing `01_NETLIFY_DEMO/` and `02_FUER_ALI_NEXTJS/` distribution paths |

The build initially failed because a dependency symlink left the isolated build root, then because of font-network/process restrictions. A fresh audit cache with the ordinary execution permission resolved those environment failures. The final build passed; do not count the earlier environment failures as application defects.

The existing E2E failure expects `Es ist noch 1 Termin geplant`. The installer changes that text to `Der Raum hat noch 1 aktive Termine/Reservierungen ...`. Blocking archive still works. Reconcile the message/test deliberately; the rest of that particular journey after its failing assertion did not run. Do not report all 32 tests as passing.

The actual HTTP probes verified availability; booking creation; exact retry returning the same ID; booking overlap rejection; Katja class overlap rejection; occupied-room archive refusal; secret-free admin listing; incorrect/correct cancellation credentials; a class succeeding after cancellation; English newcomer rendering; and loss of a stable room ID at the map redirect. These are sequential checks, not a concurrency or restart test.

Evidence: [audit evidence index](../evidence/team-audit-2026-10-31/README.md).

## 3. Findings to resolve before integration is accepted

### A-01 — Pending booking can lose its receipt and cancellation code (high)

`BookingFlow.tsx` leaves the room/date/duration controls enabled during submission. `selectionChanged()` clears `pendingRef.current`; after the response, `submit()` dereferences that ref to obtain the cancellation token.

Reproduced with a delayed successful mocked response: select 08:00, review, confirm, change duration before the response. The POST is accepted by the mock, but the UI displays `Cannot read properties of null (reading 'cancelToken')`, with no receipt. Real SQLite persistence during this exact race was not exercised; the local production API's ordinary creation was tested separately.

Integration fix: snapshot submitted selection and credentials before awaiting; prevent incompatible edits while pending or explicitly manage their state. Preserve the original credentials for an uncertain-response retry. Add a browser regression test for this sequence.

### A-02 — Missing room silently becomes another room (high)

The initial room resolver falls back to the first available room even when an explicit incoming ID/code is absent, archived or unavailable. An isolated client test supplied `missing-room-id` and observed `r-a` selected.

Integration fix: distinguish no requested room from an invalid requested room. Explain unavailability and require a deliberate alternative selection. Never silently change the room the user intends to book.

### A-03 — Map is a separate source of room truth (high)

The map reads `window.K1_DATA`; it does not read `/api/public/rooms`. It has visual IDs such as `1og-k1-120`, not database room IDs. Renaming, moving, archiving or changing reservability in Katja's panel does not update those map records or its hardcoded booking button.

Actual HTTP reproduction: `/map?raum=<database-id>&lang=en` redirects to `/map-demo/index.html?lang=en`, discarding the room selection. The route accepts selected room **codes** matching its regex, not opaque room IDs. The map also offers no schedule link.

Integration fix: bind geometry to the existing stable room IDs, resolve active room metadata through the existing room API, and suppress stale positions on floor mismatch. Preserve `raum`, `datum` and `lang` across map/schedule/booking. Keep the supplied images and useful interaction logic; no new room backend is needed.

### A-04 — Public navigation and language stop being shared on the map (high)

`/map` redirects out of `PublicShell` into an independent page. In the browser check its only anchor was the selected room's booking link: there was no Home, room directory or schedule return path. Changing language updates local JS state but not the URL; reloading reverted to the query's previous language.

Integration fix: give the map the shared public frame and language contract. Reconcile all modules' shared navigation edits once; do not apply the overlapping patches independently. Then check the portrait layout with the actual number of navigation options.

### A-05 — Booking eligibility depends on editable room codes (medium)

Both map and booking use duplicated lists of 21 codes in addition to `reservable`. A database probe renamed `K1-120` to `K1-999` without changing its ID or `reservable=true`: availability changed from success to `room_not_reservable`.

Integration decision: keep a demo selection if desired, but identify it through stable IDs/a shared manifest or use the existing admin-controlled reservable flag. Do not let an ordinary code edit silently change an unrelated permission. Preserve all current IDs and records.

### A-06 — Quality checks are not green (medium)

- Booking effect at line 92 fails `react-hooks/set-state-in-effect`.
- Unused variables: two in the map script, one `Lang` import in Reza's page.
- One existing E2E assertion no longer matches the archive message, including an awkward singular German phrase.

Resolve the effect using the project's existing request/state patterns; do not disable the rule to hide it. Align the wording and regression assertion after checking the intended behavior.

### A-07 — Booking language, receipt and API details need alignment (medium)

- Dropdown names can be English, but review/receipt use the German `.name` directly.
- API `data.message` is shown verbatim, so English mode may show German errors.
- Receipt has a 60-second clear timer, but no visible countdown, extra-time action, or return to Home as proposed in the contract draft. Shared-screen back/restore privacy has not been tested.
- Free spans can have non-grid boundaries: an actual class from 12:07 to 12:23 yielded free intervals ending 12:07 and beginning 12:23. The client rounds start candidates, but the API differs from the proposed rounded interval contract.
- Creation/cancellation response fields, admin record shape and class-conflict error codes differ from the draft. Some of those are valid simplifications if documented and agreed; the draft is not itself an implemented standard.

Agree one small contract and adapt consistently. Do not add a larger booking platform.

### A-08 — Katja cannot manage bookings through a page yet (medium)

Authenticated list/cancel APIs exist. There is no admin page for Katja to see a booking blocking a class edit or cancel a booking whose user lost the code. A small list with explicit cancellation is the useful remaining connection, rather than a large CMS.

### A-09 — Newcomer content is mostly an entry menu (content/HCI gap)

Reza has implemented a small DE/EN route and useful documentation scaffolding. It largely repeats rooms/schedule/notices navigation. It does not yet answer concrete newcomer questions with verified campus/study information; help provides no destination. Some text discusses future integration rather than the visitor's task.

Keep the static approach for MVP. Reza should establish the highest-priority newcomer questions, supply a few sourced answers and actual helpful destinations, and shorten repetitive implementation/disclaimer text. Link the real map after integration. No admin editor is required for this task unless separately chosen.

### A-10 — Package/documentation consistency and missing evidence (delivery gap)

- The supplied verifier expects distribution folders absent from this source-only delivery.
- Some earlier booking READMEs/CSS comments still say four bookable rooms; the actual policy/manifest say 21.
- Map images are explicitly described by the submissions as AI-generated illustrations, not verified campus plans. They contain plan-like room/safety markings. They may demonstrate interaction, but physical wayfinding accuracy has not been established. Do not present this as a verified campus or emergency map.
- No complete real timetable for this/next term, actual display measurements, participant observations or evaluated V1→V2 results were found in these packages.

## 4. What can be reused, without rebuilding everything

| Keep | Adapt / complete |
| --- | --- |
| Ali's stack, authentication, current announcements, rooms and sessions | Shared service wiring and the next reviewed migration |
| Aryan's illustrations, coordinate work, search and marker behavior | ID binding, floor validity, live room metadata, common navigation/language |
| Joint booking repository, validation, token hashing and public flow | Pending-request bug, missing-room recovery, eligibility, translated states, minimal admin view |
| Reza's static page, bilingual structure, sketches and documentation templates | Useful sourced content, actual display inspection, integrated links and tests |

The base app assumed `EG/1OG/2OG`; the supplied map uses `1OG/2OG/3OG`. The candidate adds `3OG` while preserving existing IDs. The team must confirm actual floor naming before relabeling old data. Never reinterpret an existing floor ID silently.

## 5. Integration order and contribution records

These are next steps, **not completed work**:

- [ ] Preserve the original submissions and source hashes; record the joint-package ownership clarification.
- [ ] Use a feature branch or worktree based on the current main. Do not rewrite existing published history.
- [ ] Import the original Aryan map as a distinct contribution; import the joint booking/map changes without installing the original map a second time; import Reza's source/docs separately. Keep integration fixes distinguishable from imported work.
- [ ] Attribute original map and Reza files to the identified contributors by name. Record joint work as joint until clarified. Ali permits names without emails; do not invent an email or promise a GitHub contributor-account link. Keep AI-use disclosure in documentation, never AI coauthor trailers.
- [ ] Finalize stable room/floor/position and booking contracts against the actual source. Update contracts and Kanban to **implemented/tested** only when those states are evidenced.
- [ ] Fix A-01/A-02; connect the map to the existing room IDs and metadata; reconcile public navigation and language.
- [ ] Complete the small Katja booking list/cancel path and Reza's sourced newcomer content. Use one controlled demo dataset for rooms and classes.
- [ ] Run relevant regression tests, typecheck, lint, unit, build and full browser suite. Test persistence after restart and two-connection conflict cases separately; neither was established by this audit.
- [ ] Walk the full Newcomer → Map → Schedule → Booking → Cancel flow and Katja → Update → Public result on the intended devices.
- [ ] Freeze an integrated V1 before collecting human observations. Then make selected V2 changes, retest, update the booklet and prepare the short presentation.
- [ ] Push reviewed commits only after the integration passes. Nothing was pushed in this audit.

## 6. HCI research and evidence still needed

Use one shared research/test plan rather than three unrelated surveys. Existing templates are useful inputs, not results.

| Owner / contribution | Next evidence to collect |
| --- | --- |
| Ali | Admin sketch alternatives; task to create/preview/publish a notice and confirm public output; task to handle a booking conflict without silently changing another record |
| Aryan | Confirm source and actual floor/room correspondence; task to find a named room, change floors and return; observe search, selection, zoom and label comprehension |
| Aryan/Parsa booking work | Clarify who contributed which changes; task to reserve a specified room tomorrow, understand conflict feedback, save credentials and cancel; observe a novice without click instructions |
| Reza | Fill screen specs from real observation/measurement; discover initial information needs; task to find a useful first-day answer in DE/EN; review translated copy |
| Shared | Three clearly labeled proto-personas; a short heuristic review and cognitive walkthrough; dated V1 screenshots; real observations → selected changes → V2 screenshots → retest |

A small formative round with approximately 3–5 volunteers across relevant roles is a suggestion, not a course rule or a representative sample. Include a newcomer/international perspective and Katja or an explicitly identified proxy if available. Record consent, anonymous participant code, task, version, device, unaided/assisted completion, observed mistakes/hesitation and comments. Time only what is actually measured. Avoid leading participants to the answer; keep a deliberately invalid-input exercise as a separate recovery task.

If tests use an illustrative map, record that they assess interface behavior rather than successful navigation in the real building. A laptop portrait viewport is not a physical touchscreen test. Automated QA counts are not human-usability evidence.

Each member's booklet should explain their actual contribution and evidence. Reza's five-page draft remains incomplete until its `NOT VERIFIED` / `NOT RUN` items are honestly updated. The others still need their final individual contributions, shared findings, actual V1/V2 evidence and the rehearsed five-minute demonstration. Course deadlines must still be checked in Moodle; old slide-year dates are not sufficient confirmation.

## 7. Current boundary

**Done:** source/artifact review, contribution comparison, isolated integration rehearsal, listed technical checks, recorded findings and next steps.

**Not done:** fixes in the real application, accepted team contracts, commit attribution changes, commits, push, deployment, real-device testing, interviews, participant tests, physical map verification, restart/concurrency validation and final booklet/presentation.
