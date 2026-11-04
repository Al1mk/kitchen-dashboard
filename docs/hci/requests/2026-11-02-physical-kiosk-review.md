# Physical kiosk review — Ali, 2 November 2026

**Status: recorded requirements; UI changes NOT IMPLEMENTED.** Ali asked to add these observations to the to-do list. This is a team member's reported review at the physical display, not a moderated study with outside participants. Codex inspected the supplied settings screenshot, a temporary Quick Look preview of `IMG_9463.DNG`, the relevant source files and official Elo documentation. No driver, system setting, application code, database or seed was changed.

Task states are authoritative in [the progress board](../../plans/team-integration-2026-10-31/02-progress.md). Detailed source boundaries are in [the evidence record](../../evidence/field-review-2026-11-02/README.md) and [screen specifications](../research/screen-specs.md).

## Confirmed context and remaining unknowns

- Settings screenshot: **ELO ET4363L**, extended display, selected **1080 × 1920**, **60 Hz**, **90° rotation**. This is the configured output, not a measured browser viewport.
- Device photo: label identifies **ET4363L / E344056**. The original photo includes a serial label and remains outside the repository; do not publish the original or its temporary preview unchanged.
- Manufacturer specification: 4363L has native landscape **1920 × 1080 @ 60 Hz**, consistent with the portrait setting. Browser zoom, CSS viewport, device-pixel ratio, mounting height and usable reach have not been measured.
- **Ali reports that touch does not work** with the display's USB connection routed through a USB-to-USB-C adapter to his Mac. No independent USB enumeration, cable/adapter test, driver/version check or calibration has been performed.
- Ali reports high mounting makes top controls hard to reach for shorter people. This motivates a reachability check; no participant height, measured reach boundary or wheelchair-accessibility result is available.
- Ali describes the screen's visual quality as poor. This is a reported perception; the cause (pixel density, browser scaling, source image quality or another factor) is not diagnosed.

## Ordered work — proposals for the next implementation round

Hardware investigation and layout sketches can proceed independently. Current permission is to **record the work**, not start implementing it. T24 remains deferred until Ali starts that round.

### T35 / P0 — Diagnose physical touch (Ali/Reza; human/device access)

- [ ] Verify the monitor's **USB-B touch/data** connection reaches the Mac through a data-capable cable and adapter; image output alone does not establish a working USB touch path.
- [ ] Check whether macOS sees the Elo USB device. Record only relevant device/driver details, without serials or a complete system inventory.
- [ ] Test a known-working data cable/adapter, then compare with a known-working host if available. Change one variable at a time and record outcomes.
- [ ] Check the actual macOS version, installed touch driver and compatibility against Elo's official macOS driver documentation. Driver installation/system changes are a separate action, not performed by this task's documentation checkpoint.
- [ ] Once touch events work, check mapping to the **external portrait display**, 90° orientation, all corners and the centre. Distinguish no touch events from events mapped to the wrong display/coordinates.
- [ ] Record a successful real-device test or the remaining blocker. A simulated Playwright touch device is not proof of hardware recovery.

Sources: [4363L manual](https://docs.elotouch.com/UM600456.pdf), [Elo macOS drivers](https://elosupport.elotouch.com/hc/en-us/p/Driver-macOS), read 2 November 2026. A driver is a diagnostic candidate; the current failure's cause is **unknown**.

### T36 / P0 — Put public controls within reach

- [ ] Measure the installed panel's lower/upper edges and comfortable interaction range; sketch the reachable zone before choosing its height in CSS. No invented centimetre threshold.
- [ ] Move primary public navigation toward the lower, reachable part of the display. Include Home/return and language switching in the reachability review. Admin layout is outside this request.
- [ ] Keep all **seven** navigation destinations. On the large portrait kiosk, arrange them as **four buttons in the first row and three centred in the second**, as Ali requested. This refers to `PublicNav`, not the home page's separate six destination cards.
- [ ] Enlarge labels, touch areas and spacing for this panel. The existing 56 CSS px minimum is only a starting point, not proof of comfortable physical use.
- [ ] Keep the current destination/state visible. Preserve DE/EN, room/date/search parameters, Back/Forward and the booking navigation guard.
- [ ] Verify the lower navigation does not cover scrollable content, search results, booking inputs, errors or receipts; keep laptop/phone layouts usable. A fixed bottom bar is one candidate, not an already selected implementation.

Likely files: `src/components/public/PublicNav.tsx`, `PublicShell.tsx`, `LiveLanguageSwitch.tsx`; inspect the separate board layout before changing it.

### T37 / P1 — Remove distracting copy; make useful text readable

- [ ] Audit public copy in both languages. Remove repetitive, developer-facing explanations and unnecessary filler, instead of merely making every paragraph larger.
- [ ] Review the shared English paragraph beginning **“Course titles, lecturers and study groups…”**. Remove the redundant explanation, or if a useful part is retained, show it at a readable size. Ali explicitly rejected tiny explanatory text.
- [ ] Keep task-relevant field labels, dates, class-cancellation status, validation errors, booking confirmation/cancellation instructions and translation fallback indicators understandable. This request is not a blanket deletion of functional feedback.
- [ ] Retain truthful sample-data identification in a compact form where relevant, without recreating the large removed prototype notice elsewhere. AI-use disclosure stays in project/report documentation.
- [ ] Evaluate text size/contrast on the actual panel and record browser zoom/viewport. No visual-quality improvement is claimed until checked.

### T38 / P1 — Home cards, imagery and header placement

- [ ] Keep Home's existing functional structure, which Ali considers acceptable.
- [ ] Make its main destination cards larger and use the available portrait space more effectively; add clear pictograms or suitable images with text labels.
- [ ] Prepare a campus/brand image treatment that brings the visual focus lower, rather than leaving the logo and useful content high above reach. The final image/asset is not supplied or selected yet; do not claim a photo or design already exists.
- [ ] Use sharp assets at the panel's displayed size and preserve button contrast. Confirm the result at the actual viewing distance.

Likely files: `src/app/page.tsx`, shared public shell and existing public assets. No new homepage destinations are requested.

### T39 / P1 — Simplify “New to campus” (review with Reza)

- [ ] Remove the entire large prototype paragraph beginning **“Student HCI prototype – not an official information system of Hochschule Coburg…”**, in DE and EN. This was the coloured/purple block Ali identified.
- [ ] Cut long, small introductory/card paragraphs; show a short title and direct action first, with genuinely needed detail secondary.
- [ ] Enlarge **Find a room**, **What is on today?**, **Current notices**, **Reserve a study room** into prominent cards that use the screen better.
- [ ] The source currently also has a fifth **Need help?** card. Treat that separately during copy/layout review: do not invent contact details or silently remove help because only four primary cards were named.
- [ ] Keep existing destinations and language handling. Coordinate content review with Reza; keep his original imported source/provenance intact.

Likely files: `src/app/newcomers/page.tsx`, `src/lib/newcomers/content.ts`.

### T40 / P1 — Rooms: adjust placement, preserve search

- [ ] Preserve room search, lecturer/class results, links and floor grouping; Ali generally accepts this section.
- [ ] Bring the shared header/image treatment and primary controls lower, consistent with T36/T38. The exact “image” position Ali refers to needs a current screen capture/sketch; do not invent a new room-photo feature.
- [ ] Recheck the Chris/day search explanation: earlier on 2 November Ali could not find Chris because the search only covered the selected day. Keep that documented issue visible during copy review; a cross-day search is a separate, unimplemented proposal, not authorized by this layout request.
- [ ] Retest `suche`, `datum`, `raum`, `lang`, history and clear/focus; do not reintroduce SEARCH-R001.

### T41 / P1 — Booking: retain behaviour, remove extra prose

- [ ] Keep the booking flow, which Ali considers good, while removing repeated prototype/developer commentary and unnecessary explanatory paragraphs in DE/EN.
- [ ] Apply reachable navigation and readable labels; do not change booking rules, APIs, database or room eligibility as part of copy/layout work.
- [ ] Preserve success/conflict/error distinctions, unresolved-request protection, the cancellation receipt/code instructions, countdown and “More time”. Recheck the earlier corrected cancelled-replay and language behaviour.
- [ ] **Schedule is accepted by Ali. Announcements are especially positively reviewed.** Preserve their functional/content layout; shared navigation changes still need regression checks. This is Ali's feedback, not a general usability score or evidence of all users' success.

Likely files: `BookingFlow.tsx`, `BookingReceipt.tsx`, `BookingCancel.tsx`, `booking-copy.ts`; choose deletions after inspecting the visible strings, not by removing all paragraphs automatically.

### T42 / P1 — Capture before/after and retest on this screen

- [ ] Capture the current V1 at the physical kiosk before edits, using the same page, language, data and browser settings for later comparisons. The supplied settings/photo do not show the current app layout.
- [ ] Record the exact CSS viewport, zoom/full-screen state and touch setup; test the actual viewport as well as the nominal 1080 × 1920 output.
- [ ] After implementation, run relevant technical navigation/search/booking checks in DE/EN, then the required regression checks for touched shared components. Run the full suite once the implementation batch is ready, not for this documentation-only update.
- [ ] After T35, perform physical touch/reach checks and short real tasks with consenting users, including people with different reach requirements where possible. Record only actual observations; no invented participant counts, timings or improvements.
- [ ] Add each implemented change to `docs/hci/change-log.md` with before version → evidence → decision → implementation → technical result → actual human retest or NOT RUN. These requested changes are not yet completed V2 evidence.

## HCI reasoning, not an improvement claim

Course references reuse the already extracted `WS26_HCI - Vorlesungsfolien.pdf` mapping in the project plan: **Fitts/motor control pp.49–50** for target size/spacing; **attention/cognitive load pp.43–47** for text and choice density; **consistency p.80** for shared navigation; **feedback p.82** for errors/results; **human-centred design p.106 and Nielsen p.130** for evaluation. Physical reach depends on the installation and users and must be checked separately; Fitts' Law alone does not establish an accessible mounting height. No new PDF extraction or measured UX benefit is claimed in this checkpoint.
