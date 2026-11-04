# V2 audit — run context and skill ledger

Executed by Claude Code (Sonnet 5.5 session, Opus 5.5 earlier in the same conversation) for Ali on **3 November 2026**, from the prompt `Project/Claude-V2-AUDIT-FIRST-2026-11-03.md` (T43). Audit and proposal only: **no product code, test, style, content, API, schema, credential, driver or system setting was changed; nothing was staged, committed, pushed, merged or deployed.**

## 1. Baseline and environments

| Item | Value |
| --- | --- |
| Repository | `campus-board`, branch `main`, HEAD `a7903db` (author and committer `al1mk`) |
| Dirty paths before the run | Modified docs (`docs/evidence/README.md`, `change-log.md`, `screen-specs.md`, `v2-decisions.md`, progress board); untracked `.claude/.headroom_wrap_settings.lock`, `docs/evidence/field-review-2026-11-02/`, `docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/hci/v2-audit-2026-11-03/README.md`. **No uncommitted runtime edits** (`git diff HEAD -- . ':!docs'` empty), so auditing a copy of the working tree equals auditing HEAD |
| Preserved | Headroom lock file, field-review documents, `.env.local`, `data/`, `.demo-data/` and Ali's manual database: not opened, not copied, not modified |
| Audit copy | Session scratch folder. `rsync` without `.git`, `.env.local`, `data/`, `.demo-data/`, `node_modules`, tests, docs; `node_modules` cloned copy-on-write. Runtime-file manifest hash `2c7a17f602d53298` identical for the original and the copy |
| Build / server | Own `next build` (exit 0) and `next start -p 3400 -H 127.0.0.1` in the copy. Ports 3000/3100/3300/3400 were free; no manual server was running; no process was stopped. Ali's `.next` was never touched |
| Database | Fresh disposable SQLite inside the copy: base seed (3 notices, 6 DEMO rooms, 9 sessions week of 2 Nov) + team seed (48 rooms, 4 sessions) = 54 rooms, 23 reservable. Seeded "today" = Tuesday 2026-11-03 |
| Credentials | Random temporary admin password and hash in mode-600 files in the scratch folder; never printed or stored in the repository; deleted at the end of the run |
| Software | Node v22.20.0, npm 11.6.2, Next 16.4.3, Playwright 1.64.1, Chromium 156.0.8078.4 (Chrome for Testing build 1248), macOS 26.6.2 arm64. Only Chromium is installed; Firefox and WebKit were **not** run and nothing was installed |
| Capture safety | Tracing, video and HAR off; receipt/cancel screenshots masked; text output redacted; a credential/token scan of every retained file found no password, hash, session material or booking value (only a class-pattern string such as `9a9999a9-…` that records the *shape* of a code) |
| Hardware | Read-only check: one built-in 5K display, **no Elo USB device enumerated, no Elo driver found**. The Elo screen was not attached to this Mac. Nothing was diagnosed or changed |

Emulation contexts (all **nominal**, none is the physical monitor): `kiosk-nominal-1080x1920` (DPR 1, touch on, `isMobile` false, Europe/Berlin), `kiosk-sensitivity-1080x1700` (assumes about 220 px of browser chrome, unmeasured), `zoom200-sensitivity-540x960` (what 200 % zoom would give, unmeasured), `laptop-1440x900`.

Timeline: Phase A report frozen **17:30:17 CET** (SHA-256 `5590f8ff…517c`, file read-only, hash in `02-phase-a-findings.sha256`) before any known-feedback document was opened. Phase B then read the supplied documents and ran the addendum checks.

## 2. Skill and tool ledger (what each one actually did)

All eleven listed skills were present under `/Users/alimk/.claude/skills/` (verified by file, then read before use). Order of use follows the master prompt.

| # | Skill / tool | Source | Purpose | What was actually done | Findings it contributed |
| --- | --- | --- | --- | --- | --- |
| 1 | `webapp-testing` | `skills/webapp-testing/SKILL.md` | Browser method | Followed its reconnaissance-then-action pattern (wait for network idle → screenshot → read DOM → act on discovered selectors) in `settle()` and the scripts. Ran `with_server.py --help` only; **not used for the server** because its examples need Python Playwright (not installed: `ModuleNotFoundError`) and I needed an isolated production build. Used the project's Node Playwright 1.64.1 instead | Method; none directly |
| 2 | `click-test-plan` | `skills/click-test-plan/SKILL.md` | Task/first-click targets | Used its structure to define target areas for ten tasks (find room, map→room→schedule, search by lecturer, day change, newcomer info, notices, book, conflict, receipt/cancel, language/Back/Home). **No click test with participants was run; no success rate exists** | Task list only |
| 3 | `workflow-progress-screenshots` | `skills/workflow-progress-screenshots/SKILL.md` | Screenshot discipline | Real renders only, viewport **and** full-page, same framing, every cited image opened and looked at, honest labels ("headless Chromium, nominal"). Its `capture.mjs`/`compare.py` were not needed (own scripts). No `SendUserFile` tool exists here, so screenshots are delivered as repository paths, not pushed to Ali | Several recaptures (e.g. map crop at 2× DPR) |
| 4 | `heuristic-evaluation` | `skills/heuristic-evaluation/SKILL.md` | Expert review | Walked the pages as new user and task flows; severity 0–4 scale; findings mapped to Nielsen heuristics in `03-comparison-and-addendum.md` §4. One evaluator only (the skill recommends several) | A-01…A-18 severities |
| 5 | `accessibility-audit` | `skills/accessibility-audit/SKILL.md` | WCAG 2.2 checks | Measured contrast (canvas pixel reading of every text node), target size, 40-stop keyboard walk with focus-ring check, landmarks/headings, labels, language attributes, live regions. Not run: screen reader, forced colours, text-only zoom | A-13 cluster, nuance on A-01 (passes WCAG 2.5.8, fails the kiosk 44 px aim) |
| 6 | `critique-visual-hierarchy` | `skills/critique-visual-hierarchy/SKILL.md` | Hierarchy | Rated entry point / eye flow / weight / emphasis for six pages from the rendered screenshots | A-09, A-10 ratings |
| 7 | `spacing-system` | `skills/spacing-system/SKILL.md` | Spacing | Compared measured gaps with the 4/8/16 scale: tabs 8 px, cards 12 px, language switch 4.2 px (below the 8 px touch-spacing rule), marker gap 0 | A-19 (addendum), A-01 gap |
| 8 | `critique-brand-consistency` | `skills/critique-brand-consistency/SKILL.md` | Brand check | `mood.md`, `voice.md`, `tokens.md` **do not exist** (searched project and vault); per the skill, those dimensions were **skipped, no brand rules invented**. Only the token table in `DESIGN.md` (provisional, sampled from screenshots) was used: rendered colours match its tokens (`#23252b`, `#5b5f69`, `#cd4026`, `#f6f4f2`, `#4c0e74`); non-token values found: `#7a4f00`, `#f1e8f8`, `#44454b`, `#ecebea`, `#fff1d6` (state/soft backgrounds, not listed in the table) | Token spot check; no brand-mood verdict |
| 9 | `web-design-guidelines` | `skills/web-design-guidelines/SKILL.md` | Code vs Web Interface Guidelines | Fetched the guideline list (public raw GitHub file) and checked the public components by targeted greps. Confirmed: no `user-scalable`, `outline-none`, `transition-all`, `onPaste` blocking; native `type="date"`; no skip link; no `text-wrap`; cancellation code field is `type="password"`; `autoFocus` only on the leave dialog | Source confirmation only, after the freeze |
| 10 | `design-qa-checklist` | `skills/design-qa-checklist/SKILL.md` | QA structure | Used its categories (visual, layout, interaction, content/states, accessibility, cross-platform) as the coverage frame and as the template for the proposal's acceptance checks. There is no design spec to compare against (no Figma, no mood/tokens), so "build matches design" could not be checked | Coverage matrix |
| 11 | `ui-ux-pro-max` | `skills/ui-ux-pro-max/SKILL.md` + `scripts/search.py` | Design support | Read the rule table; ran five `--domain ux` queries (touch size/spacing, bottom navigation/obscured content, leave/confirm feedback, long lists, small targets) and one `--design-system` query; the stack query `html-tailwind kiosk` returned 0 results. **The design-system output (dark navy palette, EB Garamond, "immersive experience" pattern) was rejected as unrelated to a provenance-labelled Coburg palette**; only its UX rules were kept (8 px touch spacing, 24 px WCAG minimum, nav must not overlap content, avoid tiny targets + scroll-heavy layouts) | Rules used in the proposal |
| 12 | `fitts-law`, `navigation-patterns` (extra, read for the proposal) | `skills/fitts-law`, `skills/navigation-patterns` | Layout synthesis | Fitts: size and distance, edges/bottom for persistent navigation, test on real devices. Navigation: reachability, consistency, active state must not rely on colour alone, ≤ 7 destinations | Dock alternatives, acceptance checks |
| – | Playwright MCP / browser tools | – | – | Not used. Direct Playwright scripts were more controllable for measurement and masked captures | – |
| – | Playwright planner/generator/healer | `playwright init-agents` exists in 1.64.1 | – | **Not used**: it writes agent files into the repository, and exploration did not need it. No healer, no snapshot approval, no test rewritten | – |

Skipped with reason: the 3D, animation, marketing, illustration, security-hunting, Vercel/deployment, database and Figma/Moda/Notion skills (unrelated). `critique-affordance`, `critique-composition`, `critique-color`, `critique-typography`, `critique-information-density`, `responsive-design`, `loading-states`, `error-handling-ux`, `search-ux`: overlap with the hierarchy/spacing/accessibility/heuristic passes above and were consolidated into them, not run separately.

## 3. Executable audit scripts

Kept in `audit-artifacts/v2-audit-2026-11-03/` (excluded from TypeScript, Vitest and Playwright test discovery; the whole project still lints at 177 files, 0 errors, 0 warnings). They require a localhost server (they refuse any other host or port 3000) and a **fresh disposable database**.

| Script | SHA-256 (first 16) |
| --- | --- |
| `audit-lib.mjs` | `e2b951d4f3b681fb` |
| `01-capture-routes.mjs` | `abb312095b67dbb7` |
| `02-journeys-find.mjs` | `1dca505165170c54` |
| `03-booking-discovery.mjs` | `7ed60411b46e84d4` |
| `03a-booking-flow.mjs` | `e01007a21b84b1e6` |
| `03b-booking-conflict-cancel.mjs` | `a53192580a668a58` |
| `03c-booking-guard-en.mjs` | `6602cb1ddbfa0e42` |
| `03d-receipt-guard-errors.mjs` | `680c30e5b1d66143` |
| `03e-cancel-wrong-wellformed.mjs` | `82f2c486285eae73` |
| `04-display-notices.mjs` | `4b8b0419e84af3f7` |
| `04b-display-scroll-probe.mjs` | `704bded921b907e8` |
| `05-touch-history-idle.mjs` | `06d3a7c75bd7cec6` |
| `05b-idle-slowload.mjs` | `fea07ab73af49ee8` |
| `06-map-crop-overlap.mjs` | `17d01e2eb725b1da` |
| `07-small-checks.mjs` | `470fbaaa02c7cff4` |
| `08-media-features.mjs` | `465726486b52bb13` |
| `09-addendum-checks.mjs` | `700a9f00d4c631fd` |

Honest notes on the runs:
- After the runs, a leading lint directive was removed from files that did not need it and a `no-unused-vars` directive was added to six files, **comment lines only**; the hashes above are of those final files.
- `05-touch-history-idle.mjs` was started as a background job that died after its second scenario; T3 (idle) and T4 (slow load) were re-run from `05b-idle-slowload.mjs`. Its first run is not counted separately.
- The first run of `02-journeys-find.mjs` failed on guessed selectors (German link text in the EN run, wrong schedule-link name); selectors were corrected from the ARIA snapshot and the journeys re-run. Only the corrected runs are cited.
- `03b` Visitor A's "wrong code" used a string of the wrong length, which tests format validation only; `03c` and `03e` repeated it with well-formed values.
- `03e` variant (b) changed the middle character of the booking ID, which was the dash of the UUID shape, so it exercised **format validation only**; a well-formed but wrong booking ID was not tested. Variant (a), a well-formed wrong code, returned `Nummer und Code passen zu keiner Reservierung.`
- `03d` S2 (Back at the receipt) was invalid because the page history held only `about:blank`; it was redone with realistic history in `05` T2.
