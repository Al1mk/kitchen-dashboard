# Claude Code prompts — Ali's V2 implementation, three stages

Prepared **3 November 2026** at Ali's request. **These prompts authorize the named implementation stages when Ali sends them to Claude. Preparing this file is not execution.** Start with Stage 1 only; Stage 2 and Stage 3 are separate handoffs. The earlier audit-only prompt remains historical and no longer limits implementation explicitly authorized by a stage below.

## Common instructions — read for every stage

You are implementing **Ali's assigned work only**, not the whole team's backlog. Read applicable `AGENTS.md`, `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/CLAUDE.md`, the canonical vault rules/current notes and:

- `docs/plans/v2-team-2026-11-03/01-team-tasks-fa.md` — ownership, AL/AP/R task IDs and acceptance.
- `docs/hci/v2-audit-2026-11-03/README.md`, `docs/hci/v2-audit-2026-11-03/03-comparison-and-addendum.md`, `docs/hci/v2-audit-2026-11-03/04-v2-proposal.md`.
- `docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/hci/research/screen-specs.md`, `docs/hci/v2-decisions.md`, `docs/hci/change-log.md`, `docs/hci/versions.md`.
- `docs/contracts.md`, `docs/run-guide.md`, `DESIGN.md`, `package.json`, `playwright.config.ts`.

Repository: `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/campus-board`.
Vault: `/Users/alimk/Documents/Obsidian/Claude/Coburg-Hochshule/HCI`.

### Protect the baseline and teammates' work

- Inspect actual branch/HEAD/dirty files first. Last observed runtime baseline is `a7903db`; do not assume it is still current. Preserve all uncommitted field-review/audit/team-plan documents and `.claude/.headroom_wrap_settings.lock`. Never reset, clean, stash away or overwrite others' work to obtain a clean tree.
- Create/use a safe Ali V2 feature branch if appropriate, keeping existing changes. Do not force-switch an unrelated active branch or mix in another member's pending runtime edits. Record actual actions; don't claim a branch/commit exists until created.
- Keep the Next.js/React/TypeScript/Tailwind/SQLite stack and stable room IDs/APIs. Read the **installed Next.js 16.4.3 documentation** before changing routing/layout/metadata APIs.
- **Ali owns:** shared public shell/nav/language helpers/global CSS/public i18n, Home page, newcomer page layout, room directory, shared integration contracts and final QA.
- **Do not implement AP tasks:** `CampusMap.tsx` is Aryan's module; booking flow/receipt/cancel/leave guard/booking-copy/DaySchedule are Parsa's; `src/lib/newcomers/content.ts` copy belongs to Reza. Prepare a concrete dependency request rather than editing those files. Ali may adapt the existing `/display` shell/navigation boundary, preserving announcement cards and admin-preview behaviour. Stage-specific file scope below applies.
- No API/schema/booking-rule changes, no new accounts, no translation service, no major dependency, no unrelated refactor. Preserve original imported team sources.
- Do not stage or commit automatically in these reviewable stages. **No push, merge, deploy, force-push or external publication.** If Ali later requests a commit, author AND committer must be `al1mk <alimk1752@gmail.com>`, with **no AI co-author/generated-with/session trailer**. Keep honest AI-use disclosure in documentation.

### Device, design and skills

- Target device: **Elo ET4363L / E344056**, configured portrait **1080×1920, 60 Hz, rotation 90°, extended Mac display**. Actual browser viewport/zoom/DPR, mounting height and comfortable physical reach are still unmeasured.
- Ali reports touch fails through a USB-to-USB-C adapter. Browser emulation is not a hardware fix. Read-only diagnosis when the unit is connected is allowed; do not install drivers, change OS/security settings or collect serials without a separate instruction. If unavailable, record WAITING_HUMAN and continue independent UI work.
- Keep current Coburg-style tokens/assets and their existing provisional status. Do not substitute the rejected navy/Garamond design-system template or claim unofficial colours are official.
- Discover the skills/tools actually available. Use relevant `ui-ux-pro-max`, hierarchy/spacing, `web-design-guidelines`, accessibility and Playwright/webapp-testing skills sequentially for the current stage; record useful outputs, consolidate overlaps and skip irrelevant skills. No new MCP/plugin or paid-service setup.
- This is an **implementation request**, not another audit-only run. The direction specified in the stage is Ali's chosen direction. Proceed with routine, reversible implementation choices and don't repeatedly ask for approval of already specified changes. A missing physical measurement must be labelled as such, not fabricated or used to abandon all UI work.

### Execution, evidence and honest validation

- Use a disposable DB and safe build/server environment. Do not change `data/`, Ali's `.demo-data/ali-manual-2026-11-01.sqlite`, `.env.local` or credentials. Don't reseed a DB containing manual test work. Capture the exact current V1 before editing; preserve the frozen audit and prior screenshots.
- Do not rebuild a `.next` directory used by Ali's running server. The existing E2E setup builds and uses port 3100; run it from a safe isolated installation/copy of the **actual modified source**, not a HEAD-only copy omitting uncommitted work. Check the port and stop only servers you started.
- Inspect the rendered UI with Playwright, including screenshots you actually open. Test nominal portrait 1080×1920, labelled 1080×1700 and 540×960 sensitivity views, laptop 1440×900, and phone 390×844. Include touch-enabled desktop emulation AND a pointer-fine portrait case: kiosk layout must not depend only on `pointer: coarse`.
- Measure target geometry, content/focus visibility and relevant contrast. A viewport simulation is not a measurement of real reach or human usability.
- Add meaningful behavioural/regression checks for the changed interactions. Never skip/weaken an assertion or silently replace a snapshot to conceal failure. Intentionally changed UI expectations can be updated with a documented reason while keeping coverage strong.
- Run targeted checks during work; once the stage is stable run the appropriate shared-component regression checks, typecheck/lint/unit/build and E2E coverage. Run the final full suite/restart at Stage 3 or earlier if the change warrants it. Report only actual commands/results; historical 152/75/13 counts are not new results. Avoid repeated full builds without changes or unresolved concerns.
- Redact/avoid credentials, cookies, cancellation codes and serials in screenshots/logs/traces. Use `PLAYWRIGHT_NO_COPY_PROMPT=1` where relevant, but do not assume that environment variable alone sanitizes all artifacts.
- Keep code-side task progress, actual design decisions and Persian vault notes synchronized. Use HCI-27/HCI-28 and existing work-log/evidence/change-ledger conventions. Write `Problem → evidence → decision → files → before/after → technical result → human result or NOT RUN`. Do not invent physical checks, interviews, timings or improved-user-success claims.
- Every stage ends with a runnable reviewable change, exact checks and remaining work. If a genuine blocker affects one item, finish the other authorized items and identify the precise blocker. **Don't begin the next stage or teammates' work automatically.**

## Stage 1 prompt — AL-01 preparation and AL-02 public kiosk foundation

Read the Common instructions above, then implement this stage now. Do not repeat the completed V2 exploratory audit. Use its findings and Ali's chosen requirements.

### Work

1. Record actual source/DB/server state and preserve a V1 before-set for the pages affected. For physical display fields, use genuine measurements if available; otherwise retain unknowns and keep T35 open. No driver installation or setting changes.
2. Implement a portrait-kiosk **bottom navigation dock** with all seven existing destinations. First row four buttons; second row three **centred as a group**; move the DE/EN switch into the reachable lower area. Preserve one primary public navigation and avoid duplicate top/bottom link sets. Admin is out of scope.
3. Scope kiosk typography/width/spacing to the public kiosk mode so admin and ordinary phone/laptop layouts are not unintentionally restyled. Use a documented viewport/orientation rule; add an explicit override only if necessary and keep its propagation predictable. Do not base the layout solely on emulated touch/pointer media.
4. Make the kiosk column, useful body/helper text and buttons more readable at the nominal target. Start from existing tokens; provisional CSS target sizes remain design choices pending physical verification.
5. Reserve real space for the dock and scrolling/focus. Bottom actions, last cards, booking inputs/receipts and validation messages must stay reachable and unobscured, including after keyboard focus. Avoid duplicated scroll traps.
6. Keep active state visible beyond colour; improve language-button spacing. Remove irrelevant shared explanatory prose from pages where it does not help (especially course-title explanations on booking/cancel), while preserving functional status/errors/fallback markers. Do not edit Parsa's booking copy/module or Reza's content file.
7. Integrate the dock into the public announcement board through the smallest shared-shell adapter needed. Preserve cards, scrolling, clock, empty/loading states and admin preview. **Do not implement the optional AL-07 “more notices” cue or auto-paging.**
8. Preserve existing query semantics: language changes keep that page's supported context; bare Rooms navigation still clears the old room-search filter; room/date links keep appropriate `raum`/`datum`; Back/Forward and SEARCH-R001 stay fixed. Don't blindly copy every query to every destination.

### Files

Primary: `PublicShell.tsx`, `PublicNav.tsx`, `LiveLanguageSwitch.tsx`, public-scoped CSS/tokens, `src/lib/i18n/public.ts`; small new public-only helper/components if useful. `src/components/display/BoardLayout.tsx` / `DisplayBoard.tsx` only for the public navigation adapter. Add tests/evidence/docs as needed. No edits to teammate-owned modules or admin components.

### Verify and hand off

- Seven destinations, correct 4+3 geometry and lower language controls; the centre uses **viewport/container width divided by two**, not a hardcoded 540 px.
- No covered last content/focused controls across the affected public pages and views; no horizontal overflow; ordinary laptop/phone retained.
- Actual DOM/screenshot checks in DE and EN and with portrait pointer-fine/touch contexts. Test search/history/language, announcement overflow/states and the **existing** pending/uncertain booking guard against the shared dock; do not fix the separate receipt-stage issue here.
- Record shared layout contract in `docs/contracts.md` or a linked small public-layout note: mode/breakpoint, width/type tokens, dock-height measurement/reservation, content/focus clearance, language/query behaviour and hooks available to Aryan/Parsa. Notify via the local handoff documentation only; don't message teammates externally.
- Write evidence under `docs/evidence/v2-ali-stage-1-2026-11-03/` (use the actual run date if later), update task/ledger/vault records and provide the evidence packet Reza needs.
- Mark AL-01 physical parts WAITING_HUMAN if unmeasured; mark AL-02 IMPLEMENTED/VERIFIED only for checks actually satisfied. End with files, tests, visible before/after and the contract AP can now use. Stop before Stage 2.

## Stage 2 prompt — AL-03 Home/Newcomers layout and AL-04 Rooms

Read the Common instructions and Stage-1 handoff/actual current source. Implement Stage 2 only. If Stage 1's layout contract is absent or broken, report and resolve that dependency within Ali's shared scope; don't pretend it exists.

### Home and newcomer page layout

- Keep Home's six destinations; use larger task cards, labelled pictograms and useful portrait space below the identity/header. Use existing/suitable provided assets; don't block on an unavailable hero photo or invent a campus image.
- Newcomers: four prominent primary action cards plus the fifth help card, with readable text. Remove the complete large coloured prototype block in DE and EN, keeping compact truthful example identification where relevant. No new CMS/destinations.
- Reza owns `src/lib/newcomers/content.ts`: consume his current text without overwriting it. If he hasn't supplied edits, implement the layout with the existing content and clearly mark the copy dependency; don't clip/hide useful text merely to force a screenshot fit.
- Own files: `src/app/page.tsx`, `src/app/newcomers/page.tsx`, public helpers/styles inside Ali's ownership. Do not add a generic template/new component library.

### Room directory

- Add easy floor jumps and a compact, readable arrangement of room actions while preserving grouping/search/stable-ID links. Include suitable scroll offsets for the dock.
- Matching classes must not be visually contradicted by a leading “no room found” box. Clarify that course/lecturer results apply to the **selected day**, and distinguish them from an office/person's current location.
- Preserve search normalisation/approved aliases, cancellation/fallback states, errors, clear/focus, filters, history and language semantics. No fuzzy/multi-day search or new staff directory.
- Do not guess Chris/Katja/Grosch offices or rename kitchen records. Reza verifies facts; show existing confirmed/demo data accurately and leave T33/T34's unverified remainder open.
- Own file: `RoomDirectory.tsx`; shared i18n/search helpers only if the change truly requires them. No edits to CampusMap or booking modules.

### Verify and hand off

Test six/five destinations and hrefs, removed prototype block, readable unclipped content, floor jumps, correct room/class result ordering/day scope, search clear/Back/Forward/DE-EN and the prior SEARCH-R001 regressions. Check layout against the Stage-1 dock and all named views. Capture matched before/after states and actual results under a Stage-2 evidence folder. Update actual task/ledger/vault records and Reza's evidence packet. Stop before Stage 3; no push or automatic commit.

## Stage 3 prompt — AL-05 shared accessibility and AL-06 integration readiness

Read the Common instructions, both prior stage handoffs and the actual current source. Implement the **shared accessibility** items and prepare/perform Ali's integration QA according to what teammates have actually delivered.

### Work and ownership

- Synchronize public document language/metadata for DE/EN with a minimal solution supported by installed Next.js docs. Account for the current English wrapper: don't misreport its practical effect as an observed screen-reader failure.
- Add/useful skip-to-content, focus without dock obstruction, adequate placeholder contrast, identifiable room action names, a non-colour active cue and consistent page identity. A Home link on the logo is a small secondary improvement.
- Correct `/display` heading semantics with no announcement-card redesign; no AL-07 cue unless Ali separately authorizes it.
- Own files: root/public layout, shell/nav/i18n/public CSS and room directory. Parsa still owns booking/cancel/DaySchedule and cancellation-page metadata; give him precise outstanding items rather than taking over AP-02/03/04.
- Integrate **only teammate changes actually delivered**, preserving authorship/provenance and their tests. Reza's copy can be consumed; do not invent a completed contribution. If AP work is not ready, complete Ali-only checks and deliver an integration checklist; mark AL-06 partial, not “full V2 finished”.
- Keep IDs, APIs, occupancy rules, state guards and credentials intact. If teammate changes alter the settled-receipt contract, document the agreed behaviour; don't silently shorten tokens, change timeouts or add persistence/idle reset.

### Validate and package

- Run typecheck, lint, unit, production build, E2E and restart validation on a safe disposable installation/DB once the integration candidate is ready. For partial delivery, state exactly which source/modules were tested and which integration remains pending.
- Add relevant assertions for language/title/heading/link context/contrast/focus and dock clearance; don't claim screen-reader or complete standards compliance without actually testing it.
- Review the actual final public screens and cross-module journey in DE/EN. Physical touch/reach and human comprehension remain NOT RUN/WAITING_HUMAN unless actual evidence is supplied.
- Update README/run instructions/contracts/task states as necessary. Prepare Reza's packet and **Ali's own five-page booklet draft** grounded in actual architecture/integration/HCI changes and results; do not write other members' personal contributions for them or invent page completion before rendering/counting.
- Final handoff: scope/files, actual validations, before/after evidence, remaining AP/Reza/hardware/human work, local Git state, and what Ali can manually test. No automatic stage/commit/push/merge/deployment.
