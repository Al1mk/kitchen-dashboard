# V2 audit — Phase A findings (frozen)

**Status: FROZEN on 3 November 2026 (Europe/Berlin) before any comparison with the team's recorded feedback.** The SHA-256 of this exact file is stored in `02-phase-a-findings.sha256` and in the run context. Later discoveries go into a separate dated addendum; this file is not edited afterwards.

Prepared by Claude Code for Ali from the master prompt `Claude-V2-AUDIT-FIRST-2026-11-03.md`. **This is a context-aware independent exploratory pass, not a blinded study.** See section 1.

Scope: public pages `/`, `/newcomers`, `/map`, `/rooms`, `/schedule`, `/booking`, `/booking/cancel`, `/display` in German and English. Admin is out of scope. **No product code, test, style, content, API or schema was changed.**

## 1. Prior exposure (disclosed before the findings)

| Source | What I already knew | Possible influence |
| --- | --- | --- |
| Earlier part of this same conversation (V1 integration, room search M1, SEARCH-R001 fix; summarised after context compaction) | I implemented the `/rooms` search, the live language switch and parts of the V1 documentation; I know the architecture, the memory-only booking receipt design, the polling model and the known test-fixture collision | I looked for, and may have been biased toward, behaviours of those modules. Not blinded |
| Master prompt (read in full) | Hardware context (Elo ET4363L, 1080×1920 portrait, touch reported not working through a USB-to-USB-C adapter), that a T35–T42 checklist and recorded field feedback exist, that Ali has page-specific choices, and that unresolved-booking protection is "already correct" | I did not search for the touch failure in the browser, and I do not claim to have found it |
| `DESIGN.md` in the repository root (read before freezing, as the token/brand reference for the brand skill) | Map markers are "≈ 20–24 px high", overlap on a narrow view is an "open analytical finding for V2 (T23)", display ≥ 44 px rule, contrast "to be audited in V2", provisional palette and a screenshot-derived logo | **A-01 (marker size) was known in principle before I measured it.** Contrast results (A-13) answer an open question stated there |
| `docs/run-guide.md`, `package.json`, `playwright.config.ts`, `.gitignore`, `eslint.config.mjs`, `tsconfig.json` | Commands, ports, the 60-second receipt, booking limits, page purposes | Used to run the isolated audit |
| `git status` output | File **names** of untracked/modified field-review documents (`docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/evidence/field-review-2026-11-02/`, edits to `screen-specs.md`, `v2-decisions.md`, progress board) | Contents not opened. I knew a field review existed |
| `tests/e2e/helpers.ts` and a grep of `tests/e2e/api-security.spec.ts` | The admin announcement payload fields, used **only** to create disposable notices for `/display` fixtures | Test support, not cause analysis |
| `tests/e2e/` directory listing | File names only, including `display-overflow.spec.ts`; contents not opened | Hinted that overflow on `/display` had been considered |
| Vault `HCI-09 Documentation rules.md` | Format rules for vault notes | None on findings |

**Deliberately not read before this freeze:** `docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/hci/research/screen-specs.md`, `docs/evidence/field-review-2026-11-02/`, progress board T35–T42, `docs/hci/v2-decisions.md`, `change-log.md`, `versions.md`, vault `HCI-00`, `HCI-05`, `HCI-25`, `HCI-26`, the prepared `docs/hci/v2-audit-2026-11-03/README.md`, and any product source for causes.
**Deviation from `CLAUDE.md`, disclosed:** it asks to read `HCI-00 Start` and the latest `HCI-05` before work. I deferred them until after this freeze because they summarise known problems; the master prompt's evidence-first order is the more specific instruction. I will read them immediately after saving and hashing this report.

## 2. Environment actually used

| Item | Value |
| --- | --- |
| Date / time | 3 November 2026, audit window about 10:15–17:30 CET; seeded "today" = Tuesday 2026-11-03 |
| Repository / baseline | `campus-board`, branch `main`, HEAD `a7903db`; no uncommitted runtime edits (`git diff HEAD -- . ':!docs'` empty); dirty paths were documentation only plus `.claude/.headroom_wrap_settings.lock` |
| Audited code | Isolated copy in the session scratch folder. Runtime-file manifest hash (src, scripts, public, package files, configs) `2c7a17f602d53298`, **identical** for the original and the copy |
| Install | `rsync` without `.git`, `.env.local`, `data/`, `.demo-data/`, `node_modules`; `node_modules` cloned copy-on-write; own production build (`next build` exit 0) in the copy, so Ali's `.next` was never touched |
| Server | `next start -p 3400 -H 127.0.0.1` from the copy. Ports 3000/3100/3300/3400 were free before; no server was running on 3000 during the audit; nothing stopped |
| Database | Fresh disposable SQLite in the copy: base seed (3 notices, 6 DEMO rooms, 9 sessions for the week of 2 Nov) + team seed (48 rooms, 4 sessions) → 54 rooms (23 reservable). Temporary admin credential with a random password in a mode-600 file; never printed |
| Tools | Node v22.20.0, npm 11.6.2, Next 16.4.3, Playwright 1.64.1, Chromium 156.0.8078.4 (headless, Chrome for Testing build 1248), macOS 26.6.2 arm64. Only Chromium is installed; **no Firefox/WebKit** (not installed; nothing was installed) |
| Capture settings | Tracing, video and HAR **off**; screenshots of receipts/cancel forms masked; headless; locale de-DE, timezone Europe/Berlin |

### Emulation contexts (all nominal simulations, none is the physical monitor)

| Label | CSS viewport | DPR | Touch | isMobile | Purpose |
| --- | --- | --- | --- | --- | --- |
| kiosk-nominal-1080x1920 | 1080×1920 | 1 | yes | no | Primary: nominal portrait kiosk. Actual browser viewport and zoom **unknown** |
| kiosk-sensitivity-1080x1700 | 1080×1700 | 1 | yes | no | Assumes about 220 px lost to menu bar/browser chrome (unmeasured assumption) |
| zoom200-sensitivity-540x960 | 540×960 | 2 | yes | no | What 200 % browser zoom on a 1080×1920 viewport would give (assumption) |
| laptop-1440x900 | 1440×900 | 1 | no | no | Shared-layout check |

DPR and any macOS display scaling of the real external screen are **not measured**.

### Hardware (facts only)
A read-only check on this Mac found one built-in 5K display; **no Elo USB device was enumerated and no Elo driver was found**. The Elo screen was not connected to this Mac during the audit, so no touch, rotation or viewport measurement of the real device was possible. Nothing about the reported touch failure was tested, diagnosed or inferred.

## 3. Method and coverage

Tasks were run with visible controls (touch taps in the kiosk context). API/admin calls were used **only** to create notice fixtures for `/display` in the disposable DB and never to complete a public journey. Measurements were read from the rendered DOM (geometry, computed styles, contrast, focus order, ARIA snapshot) and every cited screenshot was looked at.

| Area | Result |
| --- | --- |
| 8 routes × DE/EN × 4 contexts: viewport + full-page screenshots, DOM measurement, 40-stop keyboard walk, ARIA snapshot | **Done** (kiosk), viewport + measurement for the other contexts |
| Find a room by number, then map, then room schedule, then Home | Done DE and EN |
| Map marker → selected room → floor change → map search → list selection | Done DE and EN |
| Search by lecturer/course + day navigation + clear + Back | Done DE and EN |
| Newcomer information path | Done DE and EN (content is mostly navigation, A-16) |
| Schedule: next/previous day, weekend, far future, invalid date, room filter | Done DE and EN |
| Booking: choose room, slot, review, confirm, receipt (DE and EN) | Done |
| Booking conflict (two visitors, one slot), receipt expiry, cancel with bad format / wrong code / correct pair, receipt lost by reload | Done in German; English only for booking, receipt and cancel |
| Leave guard: pending/unresolved booking, nav taps and Back at the receipt, language switch at the receipt | Done |
| Controlled errors: booking POST aborted, availability API aborted, rooms API aborted (`/rooms`, `/map`), slow rooms API (4 s) | Done in German only |
| `/display` with 8 notices, no notice, over time (25 s), touch swipe, wheel, End key | Done DE and EN (empty and many) |
| Raw touch via DevTools protocol: swipe-scroll on `/rooms` and over the map image, map zoom + drag | Done once (kiosk, DE) |
| Idle behaviour | **95 s only**, on `/rooms` with a search and day set |
| Console / page / network | 0 page errors; one controlled 404; aborted requests are navigation-cancelled prefetches, not failures |
| Screen reader, forced colours, reduced motion, printing, text-only zoom, Firefox, WebKit | **Not run** (see section 7) |
| First-click / click-test success rates | **Not computable**: no participants. The click-test plan only structured task targets |

## 4. What works (to preserve in V2)

- Every nav tab is 176×56 px and every non-map target on the kiosk views is at least 44 px on its short side; booking slots are 163×64 px; no page overflows horizontally in any of the four contexts.
- Measured text contrast is at least 4.82:1 on every text node except the large `·` separators (4.39:1), the placeholders (A-13.3) and the disabled primary button; active nav carries `aria-current="page"` on all 16 route/language combinations; focus rings are 3 px on every tab stop.
- Loading, error and empty states exist with plain wording and a retry (`Räume werden geladen …`, `Termine können gerade nicht geladen werden … Erneut versuchen`, `Die freien Zeiten können gerade nicht geladen werden`, no notices, no classes). Wrong cancellation input gives distinct, non-leaking messages.
- Booking: a slot taken by someone else produces `Dieses Zeitfenster ist inzwischen belegt. Bitte wähle ein anderes.` (role alert) and the taken slot disappears from the grid; a double tap sends one request; an aborted request keeps the review panel with an idempotent retry; navigating away while the outcome is unclear opens a clear dialog (`Hierbleiben` / `Trotzdem verlassen`, 242×64 px each).
- A language switch at the receipt kept the receipt on screen (1 of 1).
- Touch swipe scrolls the page even when started on the map image; map zoom + touch drag panned the zoomed plan; Back after a search restored the search and day.
- Demo status is stated honestly on every page.

## 5. Findings

Severity uses the Nielsen 0–4 scale from the heuristic-evaluation skill (3 = major, 2 = minor, 1 = cosmetic). "Observed" = seen in the browser here; "Analytical" = reasoned from observations, not shown to fail; "Known context" = I knew it before measuring. Physical reach, readability at distance and human comprehension are **hypotheses** for every item.

| ID | Finding | Evidence type | Sev | Pages |
| --- | --- | --- | --- | --- |
| A-01 | Map markers are 53×24 px with no gaps; two overlap and K1-115 is largely hidden | Observed + known context (size) | 3 | `/map` DE/EN |
| A-02 | Unfiltered `/rooms` is 8.6 screens long with three stacked buttons per card and no jump aid | Observed | 2 | `/rooms` |
| A-03 | Leaving the receipt by any nav tap or Back destroys the only cancellation credentials; no guard | Observed | 3 | `/booking` DE/EN |
| A-04 | Cancelling needs a 36-character ID and a 43-character code typed by hand | Observed (shape) + analytical | 3 | `/booking`, `/booking/cancel` |
| A-05 | The final confirm step can land below the fold with no scroll or focus move | Observed | 2 | `/booking` |
| A-06 | No idle reset: a visitor's search, selection or half-filled form stays for the next person | Observed (95 s) + analytical | 2 | all except the receipt |
| A-07 | `/display`: notices beyond the third are reachable only by an undiscoverable inner scroll; nothing rotates | Observed | 2 | `/display` |
| A-08 | Information pages use a 728 px column on a 1080 px screen while `/display` uses a different, larger scale | Observed + analytical | 2 | all |
| A-09 | Home gives 13 entry points to 6 destinations and no dominant first task; first-screen budget is spent on notices | Observed + analytical | 2 | `/`, `/map`, `/booking` |
| A-10 | Red carries three meanings: active tab, primary action, selected state | Observed + analytical | 1 | `/rooms`, `/booking` |
| A-11 | Typing-dependent tasks on a touch kiosk with unknown on-screen keyboard; native select/date controls | Analytical, not browser-verifiable | 3 if confirmed | `/rooms`, `/map`, `/booking*` |
| A-12 | Search wording and tolerance: "no room" is shown above matching classes; no tolerance for typos | Observed | 1 | `/rooms` |
| A-13 | Accessibility cluster: `lang="de"` on English pages, placeholder contrast 3.11:1, no skip link, repeated link names, `/display` has no H1 | Observed | 2 | various |
| A-14 | An invalid room in the schedule URL is shown as a temporary outage | Observed (controlled) | 1 | `/schedule?raum=` |
| A-15 | The logo is not a link | Observed | 1 | all |
| A-16 | Newcomer page is mostly navigation; contacts and opening hours are placeholders | Observed (page says so) | 2 | `/newcomers` |
| A-17 | English booking pages open with an irrelevant course-title notice | Observed | 1 | `/booking*` EN |
| A-18 | After receipt expiry the visitor lands on Home with no message | Observed once | 1 | `/booking` |

### A-01 Map markers (severity 3)
- **Steps:** kiosk, DE and EN, `/map`, first floor (1. Obergeschoss). Measure the 21 room markers; zoom a 2× crop.
- **Expected:** marker targets comparable to the rest of the kiosk UI (44–64 px) and not overlapping.
- **Actual:** all 21 markers are 52.7×24 px, text 12 px, nearest gap 0. `K1-115` is covered by `K1-118` (overlap 23×22 px) and `K1-106`/`K1-107` touch (1 px). Markers sit over the plan's printed room names. The plan image is 726×351 px, about 18 % of a 1920 px viewport height and 67 % of the width. The other 42 interactive targets on `/map` are at least 44 px high.
- **Evidence:** `kiosk-1080x1920/map-de.viewport.png`, `journeys/M1-map-plan-crop-dpr2.png`, `data/kiosk-map-de.json` (targets, gaps).
- **Frequency:** deterministic on 1. Obergeschoss at 1080 px; other floors not measured.
- **Mitigation seen:** the room list and map search below give large targets for the same selection.
- **Consequence / hypothesis:** a tap must land within about ±12 px vertically; mis-taps and a hard-to-reach K1-115 are likely on a physical touch screen (Fitts). **Needs:** physical tap tests on the real screen.

### A-02 Room list length (severity 2)
- **Steps:** kiosk DE, open `/rooms` unfiltered; swipe.
- **Actual:** 54 cards, document 16,440 px = 8.56 screens (laptop 18 screens, 200 % zoom 17 screens). Each card stacks the links "Heute in diesem Raum", "Auf der Karte zeigen" and, on 23 cards, a filled red "Raum reservieren (Demo)". 54 + 54 + 23 links in total; no floor shortcuts or "back to top". One touch swipe of 1100 px travelled 1596 px.
- **Evidence:** `kiosk-1080x1920/rooms-de.viewport.png`, `.full.png`, `data/_touch-history-idle.json` (T1 in `logs/05.log`).
- **Consequence / hypothesis:** long dragging for a visitor who does not type; the filled red button promotes booking over location (a hypothesis about priorities). **Needs:** observed use.

### A-03 Receipt has no leave guard (severity 3)
- **Steps:** book a slot to the receipt; (a) tap nav `Start`, (b) tap nav `Karte`, (c) EN: tap `Home`, (d) browser Back with realistic history (Home → Raumbuchung → receipt).
- **Expected:** a warning like the one shown during an unresolved booking, or a way to get the credentials back.
- **Actual:** the page leaves immediately (4 of 4), no dialog; Back/Forward does not bring the receipt back. The guard dialog exists only while the outcome is pending or unclear (shown in S4). A language switch kept the receipt (1 of 1).
- **Evidence:** `logs/03d.log`, `data/_receipt-guard-errors.json` (S3.x), `logs/05.log` (T2), `data/_booking-guard-en.json`.
- **Consequence:** one stray tap on a large nav tab permanently removes the means to self-cancel. In the demo an admin can cancel, so the impact is limited here. **Needs:** observation of how people actually handle the receipt (photograph, write down, tap away).

### A-04 Credential length and typing (severity 3)
- **Observed (shape only, values never recorded):** booking ID is a 36-character UUID-shaped string; cancellation code is 43 characters with mixed case, digits and `-`/`_`. The receipt offers no copy, QR or print function. The cancel form has two empty fields without format hint.
- **Consequence / hypothesis:** the realistic path is photograph the receipt and retype about 79 characters on a keyboard that the kiosk may not have (A-11). A one-character slip gives the generic message `Nummer und Code passen zu keiner Reservierung.` **Needs:** a typing test on the real device and an observed cancel attempt.

### A-05 Confirm step below the fold (severity 2)
- **Steps:** kiosk DE, room K1-120, choose a slot (31 slot buttons), tap `Weiter zur Bestätigung`.
- **Actual:** the review panel opens below the grid; `Reservierung prüfen` sits at the bottom edge; the confirm button is at y=1960 (viewport 1920), `Ändern` at 2036, `Reservierung stornieren` at 2134. `scrollY` stayed 0; no focus move. With a shorter grid (later in the day) the confirm button was at y=1580, in view. At 1080×1700 the panel is further down.
- **Evidence:** `journeys/B2-de-confirm-step.png`, `logs/03d.log`, run output of the booking flow.
- **Hypothesis:** with the real (unmeasured) viewport the main action may be hidden; severity rises with a smaller viewport.

### A-06 No idle reset (severity 2)
- **Steps:** `/rooms?suche=Zagel&datum=2026-11-04`, no input for 95 s.
- **Actual:** URL and search field unchanged; no timeout or reset. (The receipt is the only element with a timer: 60 s.)
- **Hypothesis:** on a shared kiosk the next visitor starts from a previous person's state. Longer idle periods were not tested. **Needs:** decision on the intended reset policy and a longer idle test.

### A-07 `/display` notices (severity 2)
- **Steps:** publish 8 notices in the disposable DB; open `/display` at 1080×1920; wait 25 s; swipe, wheel, End key.
- **Actual:** the list is an inner scroll container (2,623 px of content in 1,143 px); only about 2.5 notices are visible and the third is cut by the footer; no text or control indicates more content; no rotation or movement after 25 s. A touch swipe moved it 1,440 px, so it is reachable. The window itself does not scroll. Text sizes scale with the viewport (not only its width): smallest text 22.7 px at 1080×1920, 20.1 px at 1080×1700, 10.6 px at 1440×900 (nav buttons below 44 px there). The page also carries the full nav and language switch, a clock, and no H1 (A-13.5). With no notice, a clear empty message is shown.
- **Evidence:** `journeys/D1-display-de-many.viewport.png`, `D1-display-en-many.viewport.png`, `D3-display-after-swipe.png`, `D2-display-de-empty.viewport.png`, `data/_display-scroll-probe.json`.
- **Hypothesis:** later notices go unseen when nobody touches the screen; legibility depends on the actual viewport height, which is unmeasured. The number of real notices is unknown.

### A-08 Scale and width (severity 2)
- **Actual:** on every page except `/display` the content is a 728 px column (x 176–904) with 176 px empty margins on both sides; body text is 18 px, headings 36 px, hint text 14 px (12 px on map markers). `/display` uses a 982 px wide layout with 22.7–58 px text. Home content ends at about y=1040, leaving the lower 45 % of the 1920 px screen empty; `/schedule` with 4 classes ends at y≈1120.
- **Evidence:** `data/kiosk-*.json` (text size histogram, content extent), screenshots.
- **Hypothesis:** the information pages may be small relative to a 1080 px portrait screen read at a distance, and visitors meet two visual scales on one device. Viewing distance and physical size are unmeasured.

### A-09 Home hierarchy and first-screen budget (severity 2)
- **Actual:** Home shows 7 equally weighted nav tabs (4+3 grid with an empty slot, 120 px high) plus 6 cards with the same labels as H2 headings: 13 entry points to 6 destinations. The heading "Campus-Informationen" (36 px) is the entry point; no task-first prompt (for example "Raum finden"). The header (logo, language switch, two rows of tabs) is 245 px = 13 % of the 1920 px screen and, at the 540×960 sensitivity viewport, about 39 % of the viewport height (372 CSS px). On `/map` two banners occupy y 381–557 (about 176 px) before the first control, and on a 900 px laptop viewport only the top 67 px of the plan are visible (plan top y=833). `Beispieldaten` banners repeat on map, rooms, schedule and booking (booking has two).
- **Critique ratings** (entry point / eye flow / weight / emphasis): Home minor / pass / minor / minor; Map pass / minor / minor / minor; Rooms pass / minor / major (many equal cards) / minor; Schedule pass / pass / pass / pass; Booking pass / pass / minor / minor; Display pass / minor / pass / pass.
- **Hypothesis only.** Needs participant observation.

### A-10 Red has three jobs (severity 1)
Active tab, primary action and selected slot are the same filled red (`/rooms` shows an active red tab and red "Raum reservieren" together; `/booking` adds a red selected slot). Preference/clarity concern, not a broken workflow.

### A-11 Typing and native controls (analytical, severity 3 if confirmed)
Tasks that need typing: room search on `/rooms` and `/map`, the cancel form. Room and duration use native selects (24 room options) and the date uses a native date control; their pop-up rendering is **not** captured by headless screenshots, and the date text displayed (`11/03/2026` in headless Chromium despite `de-DE`) is browser/OS dependent. Whether the real kiosk has a hardware or on-screen keyboard is unknown. **Not browser-verifiable.**

### A-12 Search wording (severity 1)
`Zagel` shows `Passende Räume · 0 Räume — Kein Raum passt zu „Zagel“. Prüfe Raumnummer oder Schreibweise.` above `Passende Lehrveranstaltungen · 2 Termine`; the negative message comes first and contradicts the useful result. `Zagl` gives 0 rooms and 0 classes without a suggestion; `qqqqq` the same. (Observed once each, DE.)

### A-13 Accessibility cluster (severity 2)
1. `<html lang>` is `de` on all 8 English routes (8 of 8).
2. `/booking/cancel` has the German document title `Reservierung stornieren – LCC Campus Board` on the English route (1 of 8 English routes), and both language versions end with "LCC Campus Board" where the other 14 titles end with "Campus Board".
3. Search placeholders have 3.11:1 contrast on white at 18 px (`/rooms`, `/map`); the disabled primary booking button is 2.18:1 (disabled controls are exempt).
4. No skip link; 9 links precede main content on every page (2 language + 7 nav); landmarks exist. Keyboard walk reached 40 stops on `/rooms` before the cap.
5. `/display` has no H1; its top heading is an H2.
6. `/rooms` repeats identical link names 54 times ("Heute in diesem Raum", "Auf der Karte zeigen"); whether context is exposed programmatically was not verified.

### A-14 Invalid room in URL (severity 1, controlled)
`/schedule?raum=k1-120` (a code instead of a room ID) calls the API with `roomId=k1-120` → 404 and the page shows `Termine können gerade nicht geladen werden. Wir versuchen es automatisch weiter.` The same message is used for a temporary outage. A hand-typed or stale link is the only way to reach this; not an unexpected regression.

### A-15 Logo (severity 1)
Tapping the Hochschule Coburg logo does nothing (not a link). Home is reachable through the first nav tab on every page.

### A-16 Newcomer content (severity 2)
`/newcomers` consists of 5 cards leading to other pages and a "Du brauchst Hilfe?" card stating that verified contacts and opening hours are not stored in the prototype. Honest, but there is no factual newcomer content. A content gap, not an interaction defect.

### A-17 English booking notice (severity 1)
On English `/booking` and `/booking/cancel` a notice about German course titles and lecturers heads the page; nothing on those pages shows course titles.

### A-18 Receipt expiry (severity 1)
After the 60 s countdown the page showed the Home view with no message (observed once; URL not recorded). A visitor who looked away sees only a different page.

## 6. Not reproduced, untested or not browser-verifiable

| Item | Status |
| --- | --- |
| Physical touch failure, USB/adapter, driver, rotation mapping | **Not browser-verifiable**; Elo screen not connected to this Mac |
| Actual browser viewport, zoom, DPR, mounting height, reach, viewing distance | **Unknown**, not measured |
| Native select / date picker appearance and keyboard on the kiosk | **Not browser-verifiable** |
| Screen reader behaviour, forced colours, reduced motion, text-only zoom | **Not run** |
| Firefox, WebKit | **Not run** (only Chromium installed) |
| Floors 0, 2, 3 marker geometry; any floor other than the first on the kiosk | **Not measured** |
| English conflict scenario; English controlled-error scenarios | **Not run** |
| Idle beyond 95 s; `/display` after many minutes of polling | **Not run** |
| Human comprehension, first-click success, time on task, satisfaction | **Not measured**: no participants, no simulated persona counts as one |

## 7. Limitations

One evaluator, one browser engine, one session; the heuristic evaluation skill itself recommends several evaluators. Seed data is synthetic and the real notice, room and class volume is unknown. All sizes are CSS pixels in nominal emulation. Severities are my judgement and are not measured user impact.
