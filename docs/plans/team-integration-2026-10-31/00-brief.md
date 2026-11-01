# LCC Campus Board — Claude integration handoff

Prepared: **31 October 2026, Europe/Berlin**. This is a plan and handoff, not evidence that its implementation has happened.

## Read in this order

1. This brief.
2. [Execution plan](01-execution-plan.md).
3. [Progress board and checkpoint format](02-progress.md).
4. [Full Claude Code master prompt](03-claude-master-prompt.md).
5. [Course concepts and evidence matrix](04-course-and-evidence.md).
6. [Human research, evaluation and delivery kit](05-human-session-kit.md).

The task-level status in `02-progress.md` is authoritative. The plan checkboxes track steps; the Obsidian notes explain progress and decisions in Persian. Update them at the same checkpoint, by task ID. Do not infer task completion from the number of files or commits.

## Project and user intent

Ali's team studies Wirtschaftsinformatik 2.0, HCI / Mensch-Maschine-Interaktion with Prof. Dr. Christian Zagel at Hochschule Coburg. They chose the touch display in the kitchen at Lucas-Cranach-Campus Kronach.

Three perspectives matter: existing students, newcomers/visitors including international students, and Katja as content administrator. The public touchscreen and Katja's laptop use the same server/data; admin access is separate and must not appear in public navigation. A normal network address/domain points both clients to that server; it does not create separate databases or require remote desktop control.

The project began with Ali's admin/announcement slice, then room and class administration and bilingual public pages. Those are components of the complete interaction concept, not the final product by themselves. Booking is a team extension, with limited real SQLite persistence explicitly selected by Ali. This remains a course prototype; no student accounts, official university integration or commercial service are required.

Latest request: prepare a complete ordered task list and prompt so Claude can integrate and fix the supplied work, document progress/contributions, and later improve UI/UX with HCI evidence. **The planning turn does not implement the application.** The subsequent Claude execution is authorized to perform the necessary cross-module integration and fixes while preserving submissions and recording actual authorship.

## Paths

| Item | Absolute location |
| --- | --- |
| Course root | `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion` |
| Application / only Git repository | `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/campus-board` |
| Canonical Obsidian notes | `/Users/alimk/Documents/Obsidian/Claude/Coburg-Hochshule/HCI` |
| Original Aryan delivery | `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/LCC_K1_COMPLETE_V12_2_QA_VERIFIED_aryan` |
| Joint delivery | `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/Parsa_Aryan_SOURCE_FINAL_Fuer_Ali (2)` |
| Reza delivery | `/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/Reza_HCI_Final_Pack` |

Use English in Claude's terminal conversation, Persian in the vault, German for admin, German/English for public UI. Do not put application code, dependencies, secrets or SQLite files in Obsidian.

## What already exists in main

Last checked main: `4ae9808edec4348f116d2d536c84eb05af151e27`. Recheck before execution; never reset newer work to this value.

- Next.js 16.4.3, React, TypeScript, Tailwind, better-sqlite3, Zod, Vitest and Playwright. Read the installed Next.js documentation before code changes.
- `/`, `/display`, `/rooms`, `/schedule` with shared public navigation and `?lang=en`.
- Katja login/admin, announcement draft/preview/publish/republish/withdraw. Published snapshots stay unchanged when a draft is edited, including English edits.
- Room create/edit/archive/restore and class create/edit/cancel/reinstate, on the same persistent database.
- Room IDs are stable **opaque strings**. Admin-created rooms use UUIDs; existing seed IDs such as `demo-room-101` do not. Never impose UUID-only validation on all room IDs.
- Room/class saves are immediately public. Announcements alone have draft/publish semantics.
- Optional English announcement and room content; existing fallback labels; official course titles/lecturers/cohorts/terms remain as entered.
- Main does **not** yet include map, booking or newcomer modules.

Existing untracked work includes the source audit/evidence, contract proposal and this handoff. A `.claude/.headroom_wrap_settings.lock` is unrelated local tooling state. Preserve it and exclude it from commits. Do not use `git add .` or discard unknown files.

## Supplied work and truthful contribution boundaries

| Source | Delivered work | What remains unknown |
| --- | --- | --- |
| Aryan original | Three images, 47 room/area records, coordinates, search, floor/zoom/marker behavior, DE/EN, survey templates and reported QA | Physical accuracy; real-user results |
| Joint Aryan/Parsa | Modified map with K1-114 unpositioned, 21-code demo selection, booking/cancel UI, SQLite repository/migration, APIs, guards and eight tests | Exact authorship of internal changes; integrated correctness beyond the audit |
| Reza | Static newcomer route/content, standalone HTML, two SVG alternatives, five-page booklet draft, display/interview/test templates | Screen measurements, sourced newcomer facts, real participant results |
| Ali | Existing platform/admin/data architecture, scope decisions and integration stewardship | Future implementation must be logged separately from imported contributions |

Ali said he does not know the exact split of work in the joint package. Do not turn a README label into proof of sole authorship. He permits contributor names without emails. Do not invent an email or promise GitHub account association. Distinguish imported source, integration adaptations, generated assistance and actual human work. Existing AI-use disclosure stays; no AI coauthor trailers and no published-history rewrite.

## Audit already completed — do not repeat it wholesale

Read [the detailed audit](../../reviews/2026-10-31-team-source-audit.md) and [its evidence](../../evidence/team-audit-2026-10-31/README.md).

Codex made a tracked-source-only temporary copy without `.env`, `.git` or the user database, installed the reviewed joint package there, copied Reza's two files and reconciled shared navigation keys. It did not fix the application or merge anything into main.

| Actual check on that candidate | Result |
| --- | --- |
| TypeScript | Passed |
| Unit suite | 96/96 passed, 12 files |
| Lint | One error, three warnings |
| Final production build | Passed after resolving audit-environment/cache restrictions |
| Existing E2E suite | 31 passed, one archive-message assertion failed |
| Real local HTTP / disposable SQLite | Ordinary create/retry/conflict/cancel and newcomer rendering worked; map redirect dropped room ID |
| Static map in Chromium | All 48 entries selectable; booking actions on 21 entries |
| Isolated booking client, mocked fetch | Normal flow worked; pending-request and missing-room defects reproduced |

The original 47 map records and all three image bytes are unchanged in the joint package. K1-114 has no coordinates. The delivered map images are described as AI illustrations; they are not independently verified campus or emergency plans. The joint verifier refers to distribution folders absent from this source-only delivery. Earlier documents still mention four rooms, while current code/manifest say 21.

Those historical results are not today's future Claude run. Do not claim 96/96 or 31/32 for a changed branch without running its tests. The audit is not a real-device, human-usability, restart or two-connection concurrency test.

## Known defects, mapped to tasks

| Audit | Issue | Plan tasks |
| --- | --- | --- |
| A-01 | Changing selection during create clears the ref later used for receipt credentials | T08 |
| A-02 | Unknown/unavailable requested room silently selects the first room | T09 |
| A-03 | Static map ignores current room metadata and stable IDs; no schedule link | T06, T07, T11 |
| A-04 | Independent map navigation/language and reload behavior | T11, T12 |
| A-05 | Editable room code controls eligibility through duplicated allowlists | T06, T07, T10 |
| A-06 | Lint error/warnings and stale E2E wording | T16 |
| A-07 | German review/errors in English; receipt/API/availability contract differences | T06, T10, T13 |
| A-08 | Admin list/cancel API exists without a Katja page | T14 |
| A-09 | Newcomer page mostly repeats navigation, help/content incomplete | T15, T21 |
| A-10 | Delivery inconsistencies, missing measurements/studies/timetable provenance | T01, T16, T18, T20–T27 |

## Integration defaults prepared for implementation

These are **proposed engineering defaults for Ali's requested integration**, not claims that all four members or the university approved them. Log alternatives if fresh inspection reveals a concrete incompatibility; do not block ordinary implementation waiting for four repeated approvals.

1. Keep the current framework, database and existing IDs. Add `3OG`; preserve `EG` without silently renaming existing data. The map's three illustrated floors remain a prototype convention pending physical verification.
2. Use one opt-in disposable team demo database. Create the 48 catalog entries with deterministic opaque IDs such as `lcc-demo-room-k1-120`; preserve original 47 coordinates and leave K1-114 unpositioned. Geometry is static and bound to these IDs; display metadata comes from the current room API. This avoids a map CMS or new map backend.
3. Never overwrite a pre-existing room with the same code and another ID. Report it; keep geometry unavailable until an explicit ID binding exists. Code matching is permitted only during the deliberate initial import/binding, not on every map render.
4. Seed the 21 supplied choices as initially `reservable=true`; use the current admin-controlled flag as the runtime authority for active rooms. Editable code is not a permission key. These are demo choices, not real campus permissions.
5. Keep the supplied small policy: Berlin time, UTC storage, 14 dates including today, 08:00–20:00, 15-minute grid, 15–120 minutes. Put it in one server policy and document it as a demo assumption.
6. Use half-open conflicts, reject class/booking collisions without silent cancellation, and make check/write atomic for every relevant mutation. Preserve class-vs-class API compatibility; identify booking conflicts clearly in the admin.
7. Put all public routes inside one shared shell/language model. Preserve opaque `raum`, optional `datum` and `lang` where meaningful. Never navigate to another room silently.
8. Keep newcomer content static for MVP; add a small Katja booking list/cancel view. No generic CMS, accounts, recurring booking, extra hardware or official university integration.
9. Receipt only: memory-held credentials, explicit Finish, visible 60-second countdown, More time, and clear/return Home in the current language. Treat this as a provisional UX choice to evaluate. Do not reset unfinished forms. General kiosk idle behavior is separate.

## Tonight's target and cut line

Aim for **T00–T19: a tested, reviewable integrated V1 plus prepared HCI materials**, with staged checkpoints. This is a target, not a time guarantee. Prioritize stable data/booking/map flows over visual polish. If time runs short, finish the smallest coherent vertical slice, record remaining tasks and leave a runnable checkpoint; never mark unfinished work done to meet a clock.

Humans must perform the human-dependent portions of T20–T22 and T25 when people/device access are available. Claude may research primary sources, perform the analytical T23 review, prepare materials and process genuine supplied observations, but cannot manufacture human/device completion. V2 cosmetic work is not a substitute for a usability study.

No retrospective claim that research preceded coding: the actual sequence was platform first, teammate prototypes, technical audit, integration, then evaluated refinement. Technical bug fixing is a technical iteration. An analytically motivated V2 is labeled analytical; human-evidence-led changes and retests get their own records. Missing participants must not be replaced by invented findings.
