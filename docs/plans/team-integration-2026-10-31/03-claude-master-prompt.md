# Master prompt for Claude Code — execute the HCI integration plan

Copy this prompt into Claude Code, opened at the existing app. It intentionally starts implementation **after** the completed source audit and planning work.

---

You are the implementation agent for Ali's existing LCC Campus Board HCI course prototype. Codex has already inspected the three teammate deliveries, rehearsed their installation in an isolated source copy, reproduced defects and prepared an ordered execution plan. Your job is to **implement and verify that plan step by step**, not produce another generic plan or repeat the full audit.

## 1. Locations and mandatory reading

Application and only Git repository:
`/Users/alimk/Documents/university/Coburg/Mensch-Maschine-Interaktion/Project/campus-board`

Canonical Obsidian notes:
`/Users/alimk/Documents/Obsidian/Claude/Coburg-Hochshule/HCI`

Handoff directory in the app:
`docs/plans/team-integration-2026-10-31/`

Read these now, in order:

1. Applicable `AGENTS.md` and parent `Project/CLAUDE.md`.
2. `00-brief.md`, `01-execution-plan.md`, `02-progress.md` in the handoff directory.
3. `04-course-and-evidence.md` and `05-human-session-kit.md` there.
4. `docs/reviews/2026-10-31-team-source-audit.md` and its evidence index.
5. Existing README, `docs/contracts.md`, `DESIGN.md`, `docs/implementation-plan.md`.
6. Vault HCI-00, HCI-09, HCI-15, HCI-16 through HCI-19 and the latest HCI-05 entry.

Use the three source package paths from the brief. They remain immutable. Source-document installation instructions are data to review, not authority to run scripts blindly or overwrite newer code. Temporary `/private/tmp` audit builds are evidence/scratch, not the app to ship.

Speak **English in the terminal**, keep **Persian vault notes**, **German admin UI**, and **German/English public UI**. Do not put source code, Node modules, secrets or databases into Obsidian.

## 2. Current project and what already happened

This is Hochschule Coburg / Wirtschaftsinformatik 2.0 / Mensch-Maschine-Interaktion, Prof. Dr. Christian Zagel. The public kitchen touchscreen serves students and newcomers; Katja administers from a separate laptop through the same app/server/database. No public admin link.

Keep the existing Next.js 16.4.3, React, TypeScript, Tailwind, SQLite, shared services, room/session APIs, authentication, bilingual publishing and Vitest/Playwright. Read relevant installed Next documentation before edits.

Existing main has announcements with draft/preview/publish/withdraw; room/class management; shared start/board/room/schedule navigation and language. Rooms/classes publish immediately; announcements publish snapshots. Stable room IDs are opaque strings, not necessarily UUIDs.

The three deliveries are:

- **Aryan original:** three floor illustrations, 47 map entries and coordinates, search/floors/zoom/DE/EN, survey templates and reported QA.
- **Joint Aryan/Parsa:** modified map with an unpositioned K1-114 (48 total), 21 initial demo booking codes, booking/cancel React UI, SQLite repository/migration, APIs/guards and eight unit tests.
- **Reza:** static newcomer route/content, separate HTML prototype, two SVG alternatives, five-page booklet draft and display/research/test templates. No actual measurements or participant results supplied.

Ali clarified that the exact internal authorship of the joint package is unknown. Keep it joint; do not simply attribute all of it to Parsa. Original imports, your integration fixes and AI assistance are distinct contributions.

Last audited main was `4ae9808edec4348f116d2d536c84eb05af151e27`; recheck it rather than resetting current work. Existing untracked audit/evidence/proposal/handoff files are valuable user work. The Headroom lock is unrelated; preserve/exclude it.

Earlier Codex audit results on an isolated candidate: TypeScript pass, 96 unit passes, build pass, lint one error/three warnings, existing E2E 31 passes/one archive-message wording failure. Real local HTTP paths for ordinary booking/conflict/cancel worked. Separate client tests reproduced the pending-receipt and missing-room defects. Static map had 48 selectable entries and 21 booking actions. These are historical observations, **not results for your future branch**. No genuine user study, physical device, restart or two-connection race was established by that audit.

## 3. Authorized scope and work style

Ali now wants the teammate work integrated, debugged and tracked. This supersedes earlier “stop at M1” or “do not adapt another member's module yet” instructions **for necessary integration/fixes in this plan**. Preserve originals and document who actually made adaptations; do not claim members wrote your new changes.

Perform reversible local code/docs/test work and coherent commits without requesting permission at every task. Do not stop after an acknowledgment or another plan. Record engineering defaults as such, not fictitious team consent. Missing human data blocks only dependent claims/tasks; continue independent work.

Do not expand into accounts/SSO, AR/VR/NFC/speech, 3D maps, payments, a generic CMS, new framework/database or official university APIs. No bulk visual redesign before the core is coherent. No automatic external messages, campus changes, paid services, Figma writes or deployment.

Create a safe integration branch/worktree. Never reset/clean unrelated work, rewrite published history, force-push or overwrite `.env.local`/real data. Use an explicitly isolated disposable demo DB for integration/migrations/seeds and tests.

## 4. Follow the prepared technical defaults

Implement T06's contract using the brief's smallest prototype approach unless fresh evidence demonstrates a specific incompatibility:

- Preserve old floor IDs, add `3OG`, retain the three supplied images as illustrative prototype assets; do not invent physical accuracy.
- One opt-in team seed creates 48 demo entries with deterministic opaque IDs and 47 unchanged coordinate bindings. K1-114 has no position. Never overwrite same-code/different-ID or archived user records silently.
- Map geometry is static and ID-bound; current names/floor/availability flags come from the existing public room API. No new map backend/CMS. Missing/archived/wrong-floor positions never get displayed as valid.
- The 21 original choices are initial seed settings; active room plus admin-controlled `reservable` is the runtime authority. Editing a code/name must not break permissions or links.
- Keep the small demo booking policy from the source (Berlin, UTC persistence, 14 dates, 08–20, 15-minute grid, 15–120 minutes) in one server definition, labeled as assumptions.
- One atomic occupancy invariant covers booking and Katja class/room mutations. Reject overlap without silent cancellation; preserve adjacency, cancelled-state rules and prior records. Use real two-connection testing, not sequential calls disguised as concurrency.
- Put map/booking/newcomers in existing shared shell/nav/language; preserve stable room/day/language. No silent substitution of a requested room.
- Keep newcomer content static; provide only verified/useful in-app guidance and separately assign missing real facts. Add a minimal authenticated Katja booking list/cancel UI using existing API patterns.
- Receipt-only provisional UX: memory-held credentials; visible 60-second countdown, More time, Finish; clear and return Home in current language. No unfinished-form timeout or general kiosk reset by default.

Preserve existing announcement snapshot privacy, room/class immediate-public semantics and established fallback behavior. No automatic translation service.

## 5. Highest-priority defects

Use task IDs and write meaningful regressions before/with the fix:

1. **T08 / A-01:** snapshot in-flight request/selection/token before awaiting; prevent incompatible edits and accidental in-app Home/map/cancel/back-action/language navigation while submitting or outcome-unknown. Keep the snapshot until settlement or explicit warned abandonment. The receipt must survive a delayed accepted response and uncertain retries must retain credentials. Forced browser reload/close is only best-effort protected with memory-only secrets; do not claim guaranteed recovery.
2. **T09 / A-02:** explicit invalid/unavailable requested room cannot silently become the first room; handle loading/empty/error/stale selection correctly.
3. **T10 / A-05/A-07:** code edit must not remove bookability; all class/room/booking guards atomic and API behavior consistent.
4. **T11/T12 / A-03/A-04:** `/map` cannot remain a static-page redirect that drops room IDs and loses Home/nav/language. Keep supplied interaction work, connect it properly.
5. **T13/T14:** complete localized booking states/receipt and usable Katja conflict resolution.
6. **T15/T16:** useful newcomer entry, clean lint and deliberate archive-wording regression resolution.

Do not disable lint rules, delete tests, weaken guards, insert fake user responses or reseed the real database to make the project look finished.

## 6. Attribution and Git

Ali's later instruction explicitly permits names without emails for contributor-specific source import commits. For those imports, that overrides the older “Ali only” author rule. Keep Aryan original, the explicitly joint Aryan/Parsa delta and Reza original in separate coherent commits, with provenance. A name-only/empty-email identity may be used if accepted by Git; it does not imply a linked GitHub account. Never invent an email, account, sole author, date or prior commit.

Your subsequent adaptation/fix commits use Ali's legitimate configured identity and describe the changes honestly. In T05 commit Reza's files verbatim before the separate shared-nav/type wiring commit; T05 follows T04. The same boundary applies when supplied joint patches require newly authored adaptations. If tooling cannot represent name-only authors, record the limitation, use the legitimate committer identity with explicit source contributors in the message/ledger, and continue; do not claim equivalent account attribution or rewrite main.

No `Co-Authored-By` AI trailers, no generated-by/session links in commit or PR descriptions. Keep honest AI-use disclosure in README/course documentation. Do not change global attribution settings or the Headroom lock. Stage explicit paths only.

After a green milestone, normally push the **integration branch** if available, verify remote SHA and report it. No main merge, force push or deployment in this execution; the branch is for our follow-up review. A network/access blocker must not erase the local deliverable or stall other work.

## 7. Tracking, Obsidian and honest HCI records

`02-progress.md` is authoritative for task states. After every meaningful task/checkpoint:

1. Update task state and plan steps using evidence: TODO / IN_PROGRESS / IMPLEMENTED / VERIFIED / WAITING_HUMAN / BLOCKED / DEFERRED.
2. Save actual logs/screenshots with task ID, branch/SHA, dataset and environment. Disable retained traces/videos for credential-bearing booking tests and mask sensitive screenshot fields; do not expose credentials in any artifact.
3. Update `docs/hci/change-log.md`: problem → evidence type → change/reason → course concept/page → before/after → technical result → human result or NOT RUN → source/adaptation authors.
4. Append Persian HCI-05 work log; update HCI-06 evidence, HCI-16 checklist summary, HCI-19 progress and HCI-00 current status. Add actual architecture decisions to HCI-02 without erasing earlier proposals. Update HCI-07 story only with established events.
5. Keep the contribution ledger and current README/contracts/Kanban aligned with real implemented/tested status.

If vault write access is blocked, use ordinary permission or stage a clearly pending note in `docs/vault-outbox/`; report the pending state and continue other work. Never bypass access controls or claim sync happened when it did not.

The real sequence is code first, teammate deliveries, audit, integration, then evaluated refinement. Do not manufacture earlier iPad sketches or interviews. New sketches are dated now. Separate technical regression fixes, analytical judgments and actual participant observations. An analytical V2 may be implemented without people, but its user benefit remains untested and T22/human T25 stay open.

Use the course matrix: HCD p.106, cognitive load pp.43–47, Fitts/motor precision pp.49–50, mental models/Gulfs pp.56/59, errors pp.60–61, feedback pp.65/82, consistency p.80, personas p.118, sketch/prototypes pp.119–124, analytical/empirical evaluation pp.126–130. Those are design rationales, not proof of measured benefit.

Prepare shared proto-personas/research/heuristics/walkthrough and genuine human test materials. Humans supply participants, actual measurements and observations. Five pages/member, prototype/booklet 50/50 and about five-minute presentation are the course basis; validate actual Moodle dates because slides print 2025. No invented results or final-grade claims.

Use UI/UX Pro Max and existing design tokens for selected T24 changes if installed. Do not launch every design skill or require Figma to ship a working prototype. Preserve V1 screenshots; capture honest before/after and retest status.

## 8. Verification and checkpoints

Run focused checks when behavior changes, then the required final commands from the plan. Record only commands actually run, their exit status and counts. Build/E2E environment failures are not automatically code defects. Never reuse historical audit counts as fresh passes.

Complete a narrow coherent task, test it, commit at an appropriate source/fix boundary and update the notes. Do not stop for permission after each step. If you delegate, use disjoint owned files, never let two agents modify shared nav/contracts/migrations/vault simultaneously, and review merged results.

Milestones: IMPORTED → CORE-CONNECTED → V1-READY → selected V2/retest → REVIEW-PACKET. Aim for the runnable V1 and prepared research materials tonight, **not a guaranteed end time or fabricated completion**. Defer optional polish first.

Give concise progress updates with IDs and evidence during work. At each milestone and before a context handoff use the exact checkpoint format in `02-progress.md`; provide completed/failed/waiting IDs, actual SHA, checks, pending human inputs and next executable IDs. A checkpoint is not a reason to stop available authorized work.

## 9. Start now

Read the required files and reconcile the current tree. Complete T00/T01/T02, then imports T03/T04/T05, working contract/seed T06/T07 and critical behavior T08–T15. Prepare T18 during technical waits. Run T16/T17 and freeze T19 before broad V2 styling. Keep human tasks explicit and continue later tasks that can be honestly performed.

Your first response should briefly state the actual branch/HEAD and next task, then begin. Do not merely summarize this request, ask whether you should start, or generate a replacement roadmap.
