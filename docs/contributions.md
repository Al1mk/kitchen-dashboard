# Contribution and provenance ledger

Started 2026-10-31 (Europe/Berlin) on branch `integrate/team-v1-20261031`, based on `main` at `4ae9808`. This ledger records **who supplied what**, how it entered the repository, and which later changes are integration work. It is updated at every import/integration checkpoint.

## 1. Source packages (immutable inputs)

The three packages live outside the repository, under the course `Project/` folder. They are never edited. On 2026-10-31 all **67 files** were re-hashed against `docs/evidence/team-audit-2026-10-31/source-manifest.json`: 67/67 identical SHA-256, no missing files, no unlisted files.

| Package folder | Supplied by (supported attribution) | Confidence | Content |
| --- | --- | --- | --- |
| `LCC_K1_COMPLETE_V12_2_QA_VERIFIED_aryan` | **Aryan** (spelled "Arian" in the older README) | Identified by the submission and by Ali | Original map V12.2 ZIP (3 floor illustrations, 47 room/area records, coordinates, search/floor/zoom, DE/EN), separate Netlify demo ZIP, survey ZIP, reported QA files |
| `Parsa_Aryan_SOURCE_FINAL_Fuer_Ali (2)` | **Aryan and Parsa, jointly** | Joint delivery confirmed by Ali; **internal split UNKNOWN** | Modified map (adds unpositioned K1-114, booking action, `?raum` handling), booking UI/API/SQLite repository/migration/guards, 8 unit tests, seed script, installers, docs |
| `Reza_HCI_Final_Pack` | **Reza** | Identified by Ali | Static `/newcomers` route + content, standalone HTML prototype, two SVG sketches, five-page booklet draft (MD/DOCX/PDF), screen/interview/test templates, two patch suggestions |

Ali stated on 2026-10-31 that he does not know how Aryan and Parsa divided the joint work. Older package labels ("Parsa's booking") are **not** treated as proof of sole authorship. Until both members clarify, every file from the joint package is attributed to "Aryan and Parsa (joint)".

## 2. Commit attribution rules used in this branch

> **Superseded before publication (2026-11-01):** at Ali's instruction, every commit of the outgoing batch — including the three imports below — now has exactly `al1mk <alimk1752@gmail.com>` as Git author and committer. Teammates' work is identified by the commit subject (`Aryan part:`, `Aryan + Parsa part:`, `Reza part:`) and body and by this ledger; Ali imported their deliveries, he did not write them. The SHAs in this ledger are the pre-publication ones; [`history-mapping-2026-11-01.md`](history-mapping-2026-11-01.md) maps each to its published SHA. The rules below record how the batch was first committed on 2026-10-31.

- **Original contributor imports** (verbatim files from a package, or the package's own scripted patch output) are committed with the contributor **name only and an empty email**, as Ali permitted on 2026-10-31 for these imports. Git accepted `Name <>` authors in a scratch test on 2026-10-31. The committer field remains Ali's normal identity, because Ali's checkout performed the import.
  - Aryan original: author `Aryan <>`.
  - Joint package: author `Aryan and Parsa (joint) <>`.
  - Reza original: author `Reza <>`.
- An empty email does **not** link a GitHub account and does not claim one exists. No email, account, date or earlier commit is invented.
- **Integration adaptations and fixes** written for this branch are committed under Ali's configured identity. Commit messages say which original contribution they adapt. Original contributors are not credited with code they did not write.
- **AI assistance:** the integration work in this branch is carried out by Ali with Claude Code (Anthropic) as coding assistant; the 2026-10-31 source audit and plan were prepared with Codex. This is disclosed here and in the README/course documentation, **never** as `Co-Authored-By` trailers or "generated with" lines in Git metadata.
- No history rewrite, no force-push, no merge to `main` in this integration run.

## 3. Planned commit boundaries

| Task | Commit content | Author field |
| --- | --- | --- |
| T00/T02 | Audit/plan documents baseline (`201a006`), this ledger, demo-DB ignore rule | Ali |
| T03 | Aryan V12.2 map files exactly as in `LCC_K1_FOR_ALI_V12_2.zip`, survey templates, QA reports | `Aryan <>` |
| T04 | Joint package `add/` files verbatim, the shared-file edits produced by its own reviewed `apply_to_repo.py` patch function, its map delta over T03 and its map-nav edit, plus its docs | `Aryan and Parsa (joint) <>` |
| T04 (if needed) | Any adaptation required to make the joint patch fit the current tree | Ali |
| T05 | Reza's two source files and documentation verbatim | `Reza <>` |
| T05 | Shared nav/i18n wiring for `/newcomers` | Ali |
| T06+ | Contracts, seed, bug fixes, map integration, admin UI, tests, docs | Ali |

## 4. Import log

Filled in as each import happens (actual SHAs).

| Task | Commit | What entered | Verification |
| --- | --- | --- | --- |
| T00 | `201a006` | Audit/plan baseline docs | Secret pattern scan: no matches |
| T03 | `7326b8e` (author `Aryan <>`) | `public/map-demo/` (3 PNG, data.js, app.js, styles.css, index.html, rooms.json), `src/app/map/page.tsx`, `docs/team-sources/aryan-v12.2/` (README, PR body, installer, survey templates, QA reports) — byte-identical to the ZIPs | 47 unique entries (21/18/8), PNG hashes equal to joint copy, `node --check app.js` ok |
| T04 | `1c566f3` (author `Aryan and Parsa (joint) <>`) | `PARSA_BOOKING/add/**` verbatim; shared-file edits produced by the package's `apply_to_repo.py` (reviewed; run with `python3 -I -B` on the branch; 10/10 anchors matched once); `ARYAN_MAP` delta files; `INSTALL_COMBINED.py` `plan_nav` edit applied with the same anchors; docs under `docs/team-sources/aryan-parsa-joint/` | typecheck exit 0; `tests/unit/bookings.test.ts` 8/8 |
| T05 | `6bc0b21` (author `Reza <>`) | `src/app/newcomers/page.tsx`, `src/lib/newcomers/content.ts`, `docs/hci/{booklet,design/reza,research,testing}/` verbatim; prototype, patches, screenshot, coordination notes under `docs/team-sources/reza/` | `diff -r` of docs vs. package: identical. Intermediate commit does not typecheck alone (section key added in `cb74062`) |

## 5. Integration adaptations log

Each entry: task, file(s), what changed relative to the imported source, why, author.

| Task | Commit | Adapted source | Change | Author |
| --- | --- | --- | --- | --- |
| T05 | `cb74062` | Reza's patch suggestions 01/02 | Added `newcomers` section key, DE/EN labels and nav entry by hand (patches no longer applied cleanly after T04) | Ali |
| T07 | `7cae97f` | Aryan's catalog + joint 21-code choice | Generated typed catalog with fixed ids, ID-bound geometry module, guarded seed; the joint `scripts/seed-parsa-demo-rooms.ts` stays as imported but is superseded for the demo | Ali |
| T06 | `fe8d7c3` | Older `docs/contracts.md` + joint booking API as imported | Working integration contract C1–C9 (room ids, URL context, booking policy/errors, occupancy, receipt); labelled as Ali-authorised engineering defaults, not team consensus | Ali |
| T10 | `ead0cf0` | Joint booking policy/repository/routes (incl. its 21-code allowlist) + Ali's rooms/sessions repositories | New `src/lib/occupancy/conflicts.ts`; all occupying writes in `BEGIN IMMEDIATE`; eligibility from the `reservable` flag (allowlist removed); `booking_conflict`/in-use guards; busy → 503; worker-thread concurrency test; joint `tests/unit/bookings.test.ts` adapted with marked comments | Ali |
| T08, T09, T13 (part) | `fb55c6d` | Joint `BookingFlow.tsx` (Aryan and Parsa) | Flow restructured: request snapshot before sending, lock and leave guard, identical retry, no room substitution, keyed availability; new receipt, cancel component, DE/EN copy | Ali |
| T11, T12 | `fac4a89` | Aryan's map (search, zoom, geometry, images) + joint delta | React `CampusMap` in the shared shell with live room data and id-bound markers; seven-section navigation and context links; E2E specs; screenshot output folder configurable. Aryan's static map files stay as imported | Ali |
| T13 | `5e114cb` | — | Receipt/cancellation browser tests only | Ali |
| T14 | `5859bb4` | Joint admin booking APIs | Katja's "Reservierungen" page, explicit cancel dialog, link from the class-conflict message | Ali |
| T15 | `5c5a3c9` | Reza's newcomer page/content (`6bc0b21`) | Cards rewritten to working in-app destinations; one prototype note; open fact questions recorded for Reza. Reza's original stays in history | Ali |
| T06, T16, T17 | `64d2801` | Aryan's `public/map-demo/app.js` (two unused variables only) | Contract unit tests, restart script extended for bookings, lint clean; the only edit to an imported original file is the removal of two unused variables in `app.js` | Ali |
| T16, T18, T19 | `43bd5f2` | Team documents as imported | README/DESIGN/contracts updates; HCI ledger, templates, outlines, versions (no study claimed) | Ali |
| T23 | `50bd120` | — | Analytical heuristic review, walkthrough, ranked V2 candidates (analytical evidence only) | Ali |
| Review | `83efaac` | — | Independent integrated-V1 review documents and evidence, written by Codex for Ali and committed unchanged | Ali (committer); review by Codex |
| V1-R001, V1-R002 | `9144cff` | Ali's T08/T13 receipt code | Cancelled replay shown as cancelled; receipt localizes source names at render; review probes activated; new regressions | Ali |

Documentation/board-only commits (`b2b3a36`, `4bb9c2d`, `c2933f6` and the 2026-11-01 documentation commit) change no runtime code. All Ali integration rows from T05 onward were produced with Claude Code assistance at Ali's request (see §2); no row assigns new code to Aryan, Parsa or Reza, and the internal Aryan/Parsa split stays unknown (§6).

## 6. Unknowns that stay unknown

- Internal Aryan/Parsa split of the joint package — question for Aryan and Parsa.
- Physical accuracy of the three floor illustrations (described by the submissions as AI-generated illustrations, not verified plans).
- Provenance of the K1-114 entry (the package mentions a campus plan that was not supplied).
- Real newcomer facts, screen measurements and any participant results (none were supplied).

## V2 source and adaptation — 4 November 2026

| Scope | Original contribution | Integration / correction | Attribution limit |
| --- | --- | --- | --- |
| Ali Stages1/2 | Shared kiosk dock/scale, Home/Newcomers presentation, Rooms floor jumps/result ordering | Ali, assisted by Claude Code; independent Codex review and combined validation | Reza’s content.ts remains unchanged; no claimed human study |
| Parsa V2 | Receipt acknowledgement/leave dialog/warning, review/result scroll, code visibility, concise copy, schedule booking CTA, five E2E cases | Parsa submission, [manifest](team-sources/parsa-v2/source-manifest.json) and immutable original diff in integration evidence | Do not infer individual authorship of old Aryan+Parsa joint code |
| Review fixes R001–R006 | Findings in the independent 4November package review | Ali assisted by Codex: restore essential pending warning, stable warning layout, 404 invalidation/recovery, EN metadata, literal input hints and truthful photo caption | This is Ali’s subsequent work, not a claim that Parsa delivered the fixes |
| HCI evidence and handoff | Historical V1 and frozen PhaseA evidence retained | Ali/Codex records real fail-before/pass-after and combined checks, Persian vault and Stage3 handoff | Automated emulation ≠ participants or physical touch |

All local integration commits use Ali’s exact author **and committer** `al1mk <alimk1752@gmail.com>`, with human contribution described in subjects and this ledger; no teammate email is invented and no AI attribution trailer is added. AI assistance remains disclosed here and in course documentation. User controls publication.

## Aryan AP01 import and Ali repair — 4 November 2026

| Contribution | Source / executor | Boundary |
| --- | --- | --- |
| AP01 marker grouping, chooser,17 unit and2 browser tests | Aryan’s original delivery, preserved in source archive and import commit `9b6eaba` | Original four-file patch imported before adaptation; known original defects are documented, not hidden |
| Actual CSS hit-size measurement, keyboard/lifecycle focus, EN fallback, cluster-aware tests | Ali with Codex assistance | Separate repair commit;6 new browser regressions and4 scale tests; API/IDs/schema unchanged |
| Editable five-slide deck, PDF, German script and five-page booklet working draft | Ali with Codex Presentations/Documents assistance, derived from Aryan’s PDF/outline and actual evidence | Editorial aid for Aryan/Parsa/Reza approval; not represented as their completed personal work, survey or rehearsal |

Git author and committer remain `al1mk <alimk1752@gmail.com>` as Ali requested. No teammate email or AI co-author is invented. Earlier Aryan/Parsa joint-source attribution remains joint. Claude’s12 dirty Stage3 files are separately snapshotted and excluded from these commits. [Repair evidence](evidence/aryan-ap01-fix-2026-11-04/README.md).

## Ali Stage3 completion — 5 November 2026

| Contribution | Executor / assistance | Boundary |
| --- | --- | --- |
| Shared skip link, document-language sync, focus clearance, room-action names, placeholder contrast, board headings and linked logo; 27 browser cases and original capture/mutation tooling | Ali with Claude Code | Builds on accepted Stages1/2 and existing Aryan/Parsa modules; their original commits and Reza's content stay intact |
| Exact cancellation-title suffix and stricter DE/EN assertions; audit-runner failure propagation and preservation; capture-provenance correction | Ali with Codex | Later integration fixes, not attributed to Parsa or presented as Claude's original completed delivery |
| Source-matched completion checks and separate read-only code review | Ali with Codex | 187 unit, 180 E2E, 13 restart checks; no actionable runtime regression in static review; no physical/screen-reader/human acceptance claim |

Only code, tooling and necessary project records are in this delivery. Ali deferred Booklet work. Existing team contributions remain credited above; all new commit author/committer metadata use Ali's exact requested identity, without AI trailers. No push by Codex. [Completion evidence](evidence/v2-ali-stage-3-2026-11-04/README.md).
