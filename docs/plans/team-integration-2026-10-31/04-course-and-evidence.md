# Course concepts → project actions → evidence

Prepared 31 October 2026. PDF page references below are **one-based PDF page positions**, not inferred chapter numbers. Text was extracted with MarkItDown and inspected in this planning turn. Images/diagrams with little extractable text are not treated as detailed written requirements.

## Primary course sources

- Course root: `WS26_HCI - Vorlesungsfolien.pdf`.
- Course root: `Sketching Tools.pdf`.
- `transcript/HCI-1.docx` and `transcript/hci-2.md`.
- `HCI - Vorlesungsfolien_Gamification.pdf` is largely graphical in text extraction; no gamification feature is justified merely by that PDF's presence. It is outside this MVP's needs.

## Confirmed assessment basis and limits

Main slides p.5: Option A is the kitchen display on the LCC first upper floor; prototype 50%, booklet 50%, five pages per person, relation to course concepts and description of technologies. The first transcript allows a four-person team when group size does not divide evenly, asks for named individual contributions, and describes an approximately five-minute prototype presentation. No extra enterprise feature is required simply because the team has four members.

The slide dates explicitly say **2025**. Do not silently change them to 2026. Ali/team must check Moodle for current dates and submission format (T21). A twenty-page minimum individual-content allocation follows from four × five; shared pages should not conceal whose work is assessed. A page-by-page template below is our organizing suggestion, not a professor-mandated format.

## Evidence matrix

| HCI concept / source | Current issue or reason | Planned action / task | Evidence to retain | Honest claim before human testing |
| --- | --- | --- | --- | --- |
| Human-Centered Design — main p.106; Design Thinking p.107 | Software came before formal research | Three proto-personas, context/needs, test and iterate (T18, T20–T25) | Dated assumptions; real observations; decision log | HCD workflow prepared; effectiveness untested |
| Attention and cognitive load — pp.43–47 | Shared kitchen, brief visits, many competing controls | Few clear task entries; booking steps; concise content (T09, T12, T15, T24) | Alternative layout; task completion/hesitation; screenshots | Designed to reduce load; no measured reduction yet |
| Motor precision / Fitts' Law — pp.49–50; transcript 2 motor section | Small map labels and distant actions | Generous separated targets; evaluate marker overlap and controls on actual screen (T11, T20, T24) | CSS target measurements and real-device observations | CSS dimensions checked; physical usability not established |
| Mental models — p.56 | User expects the same room across map, schedule, booking and admin | Stable ID and consistent names/status; never substitute another room (T06–T12) | Rename/floor/archive test and walkthrough | Cross-page consistency verified to listed test scope |
| Gulf of Execution / Evaluation — p.59 | User needs to know what action and whether it worked | Clear actions, review and truthful receipt/status (T08, T09, T13, T14) | Slow-response test, receipt screenshot, human interpretation | Feedback behavior tested; comprehension remains to evaluate |
| Errors and recovery — pp.60–61 | Wrong room, collision, lost response or cancellation code | Explicit invalid-room state; idempotent retry; server guards; recoverable errors (T08–T10, T14) | Before-fail/after-pass regression; HTTP/DB evidence | Listed error cases prevented/recoverable; not all errors eliminated |
| Feedback latency — p.65; UI feedback p.82 | Network operations can appear unresponsive | Immediate visible pending state, disabled duplicate action, clear error/retry (T08, T09, T13) | Delayed-response browser recording/log | Delayed response handled; no universal response-time claim |
| Mapping — pp.77–79 | Static illustration and live room could disagree | Bind geometry to room ID; suppress wrong-floor markers (T07, T11) | Data provenance and rename/move/archive examples | Marker matches supplied illustration; real building accuracy unverified |
| Consistency / predictability — pp.80–81 | Map uses its own menu and language state | Shared shell/nav, consistent route/query meanings (T11–T13) | Click-only DE/EN journeys, reload/back checks | Same navigation/language contract implemented |
| Personas — p.118 | Three roles known, needs assumed | Three joint proto-personas with assumption/source labels (T18) | Hypothesis → interview/observation update | Proto-personas, not interview-derived personas |
| Sketching — pp.119–122; paper prototypes pp.123–124 | Existing prototype is not proof of alternatives explored earlier | Date real new alternatives; compare and record choice (T18, T23–T24) | Current sketches/annotations and why one was chosen | Alternatives created/reviewed on the recorded date |
| Sketching interactions / paper / device prototypes — Sketching Tools pp.5, 9–10 | Need show user, device, action and result | Draw newcomer and Katja flows; paper-walk a confusing state (T18, T20, T23) | Sketch/paper-test artifact; device notes | Proposed interaction, unless actually tested |
| Formative vs summative evaluation — p.126 | Team needs actionable issues, not inflated scores | Small formative test before selected V2 changes (T22–T25) | Task observations, issue ranking, change, retest | Small formative evidence; no representative statistical claim |
| Analytical vs empirical evaluation — p.128 | Automated tests and reviewer opinions are mixed with human evidence | Label code tests, heuristic review, walkthrough and human test separately (T17–T25) | Different evidence types in ledger | Analytical finding is not a participant observation |
| Task walkthrough — p.129 | Can user recognize goal/action and feedback? | Ask the slide's three questions at each step (T18, T23) | Step-by-step answers with screenshots | Evaluator walkthrough, not human-user success |
| Nielsen's ten heuristics — p.130 | Broken return path, opaque feedback, duplicate language patterns | One shared evaluation, not four duplicate reports (T18, T23) | Heuristic, issue, severity, suggested change, verification | Reviewer finding until actual user observation exists |

Suggested 56px/64px controls, 3–5 participants and a 60-second receipt timeout are proposed design/test defaults, **not official requirements in these slides or evidence of team consensus**. CSS pixels are not the measured physical target size. Color contrast must be measured; a chosen color is not automatically compliant. Avoid status communicated by color alone.

## Mandatory change ledger format

Claude creates `docs/hci/change-log.md` and adds one record per meaningful change:

| Field | Required content |
| --- | --- |
| Change ID / task / audit finding | Example `CH-001`, T08, A-01 |
| Before version and problem | Actual source/commit; concrete trigger and observed behavior |
| Evidence type | Technical regression / heuristic review / human observation / assumption |
| Source evidence | Existing log, screenshot, participant record, or clearly marked missing |
| HCI concept and course reference | Explain the relationship in one sentence; do not cite a slide as measured proof |
| Decision and alternative | Selected fix, smaller alternative considered, reason |
| Contribution provenance | Original source owner; who adapted it; AI assistance used |
| After version and files | Real commit when it exists; otherwise uncommitted status |
| Technical validation | Exact check run/result, or NOT RUN |
| Human result | Actual observation/retest, or NOT RUN |
| Limitations and follow-up | Remaining issue, owner, next task |

Example, not a completed record: “Snapshot the in-flight request and disable conflicting selection edits. This supports feedback/error prevention because the receipt represents the operation actually submitted. Before/after browser regression required. Human understanding not tested.” Never convert this example into claimed results.

## Version and screenshot discipline

- Keep original deliveries immutable and their reported V12.2 naming intact.
- Name the integrated technical baseline `integrated-v1`; store its actual commit/hash, demo manifest, exact viewport/device and DE/EN screenshots.
- Do not rename technical fixes to imply a human-tested V2. Record technical iterations as such.
- After real findings select a small V2 set. Record `V1 evidence → decision → changed UI → technical checks → retest`.
- Preserve before/after images and annotate the visible change. A Figma mockup is labeled as a design, not a live app screenshot; a portrait browser is labeled as simulated.
- Keep historical logs unchanged. Old commit IDs can be traced through the existing vault mapping; do not rewrite logs to claim they were run on newer code.
