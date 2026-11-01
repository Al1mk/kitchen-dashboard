# Pre-publication history mapping — 1 November 2026

Before the integration branch was first published, Ali asked (2026-11-01) that **every commit in his outgoing batch carry exactly `al1mk <alimk1752@gmail.com>` as Git author and committer**, replacing his earlier permission (2026-10-31) to record the three teammate imports with name-only authors (`Aryan <>`, `Aryan and Parsa (joint) <>`, `Reza <>`). Teammates' work is identified instead in the commit subject (`Aryan part:`, `Aryan + Parsa part:`, `Reza part:`) and body, and in [`contributions.md`](contributions.md). Ali imported their deliveries; he did not write them.

What changed, and only this (verified commit by commit with a script, executed by Claude Code for Ali):

- Author and committer name/email of all 24 unpublished commits → `al1mk <alimk1752@gmail.com>` (before: `Al1mk` with capital A for Ali's commits; name-only authors for the three imports).
- The three import commits: new subject; the original subject is kept as the first body line, and a short provenance note was added at the end of the body.
- Unchanged: every file tree, the order and parent structure (linear, no merges), all author and committer timestamps, every other commit message. No trailers or signatures existed or were added. Published `main` stays at `4ae9808edec4348f116d2d536c84eb05af151e27`; at the time of the rewrite the remote had no other branch or tag.
- The pre-rewrite tip `6ca7e40` and the rewritten tip `b1e89f2` have the identical tree `9c2f462122e35806733cdc93f63c153ae4800c13`; therefore no runtime or test file changed and earlier test results still describe exactly the same code.

Logs and documents written before this date quote the **old** SHAs (for example test runs on `64d2801` or `9144cff`). They were not edited; use the table below to find the published commit. No test ran under a new SHA before this mapping was made.

| # | Old SHA | New SHA | Source owner | Subject (new) |
| --- | --- | --- | --- | --- |
| 1 | `201a006` | `bf7a2ed` | Ali (integration, with Claude Code/Codex assistance) | docs: add team source audit, contract proposal and integration handoff plan |
| 2 | `bb00a2a` | `b760429` | Ali (integration, with Claude Code/Codex assistance) | docs: contribution ledger and isolated demo database setup (T01, T02) |
| 3 | `7326b8e` | `746f1e7` | Aryan | Aryan part: import original campus map V12.2 |
| 4 | `1c566f3` | `a06edaa` | Aryan + Parsa (joint, split unknown) | Aryan + Parsa part: import joint booking module and map changes |
| 5 | `6bc0b21` | `c2fd85a` | Reza | Reza part: import newcomer guide and HCI materials |
| 6 | `cb74062` | `a725d78` | Ali (integration, with Claude Code/Codex assistance) | feat(newcomers): wire Reza's /newcomers route into shared public navigation (T05) |
| 7 | `fe8d7c3` | `76f789b` | Ali (integration, with Claude Code/Codex assistance) | docs(contracts): working integration contract for map, booking and newcomers (T06) |
| 8 | `7cae97f` | `ad30fdf` | Ali (integration, with Claude Code/Codex assistance) | feat(map): ID-bound map geometry and opt-in team demo seed (T07) |
| 9 | `b2b3a36` | `9eb8959` | Ali (integration, with Claude Code/Codex assistance) | docs: IMPORTED checkpoint in progress board and contribution ledger |
| 10 | `ead0cf0` | `12d8293` | Ali (integration, with Claude Code/Codex assistance) | fix(booking): one atomic occupancy invariant; eligibility from the reservable flag (T10, A-05/A-07) |
| 11 | `fb55c6d` | `39d2652` | Ali (integration, with Claude Code/Codex assistance) | fix(booking): keep the submitted request and receipt; never substitute a room; localized states (T08, T09, T13 part) |
| 12 | `fac4a89` | `09eebde` | Ali (integration, with Claude Code/Codex assistance) | feat(map): live-ID campus map in the shared shell; shared navigation and context (T11, T12) |
| 13 | `5e114cb` | `0a6eeb1` | Ali (integration, with Claude Code/Codex assistance) | test(booking): receipt countdown, More time, Done and public cancellation states (T13) |
| 14 | `5859bb4` | `ebf7909` | Ali (integration, with Claude Code/Codex assistance) | feat(admin): Katja's booking list with explicit cancellation and conflict link (T14) |
| 15 | `5c5a3c9` | `75ddded` | Ali (integration, with Claude Code/Codex assistance) | feat(newcomers): task-oriented cards with working in-app destinations (T15) |
| 16 | `64d2801` | `7588746` | Ali (integration, with Claude Code/Codex assistance) | test: contract tests, booking restart persistence, clean lint; T17 acceptance evidence (T06, T16, T17) |
| 17 | `43bd5f2` | `7589970` | Ali (integration, with Claude Code/Codex assistance) | docs: integrated V1 documentation, HCI ledger and research kit (T16, T18, T19) |
| 18 | `4bb9c2d` | `48b724e` | Ali (integration, with Claude Code/Codex assistance) | docs: V1-READY (local) checkpoint in the progress board |
| 19 | `50bd120` | `356736a` | Ali (integration, with Claude Code/Codex assistance) | docs(hci): analytical heuristic review, walkthrough and ranked V2 candidates (T23) |
| 20 | `c2933f6` | `6e3bcc4` | Ali (integration, with Claude Code/Codex assistance) | docs: review handoff packet; T23/T24/T29 states on the progress board |
| 21 | `83efaac` | `9664a11` | Ali (integration, with Claude Code/Codex assistance) | docs: independent integrated-V1 review, evidence and reopened T13 (2026-11-01) |
| 22 | `9144cff` | `27ef96b` | Ali (integration, with Claude Code/Codex assistance) | fix(booking): show a cancelled replay as cancelled; receipt follows the language switch (V1-R001, V1-R002) |
| 23 | `c7b9159` | `db04953` | Ali (integration, with Claude Code/Codex assistance) | docs: record the V1 corrections; reconcile ledger, plan checkboxes and board (T13 verified) |
| 24 | `6ca7e40` | `b1e89f2` | Ali (integration, with Claude Code/Codex assistance) | Ali part: record independent verification of corrected V1 |

Full 40-character SHAs: [`evidence/publication-prep-2026-11-01/mapping.json`](evidence/publication-prep-2026-11-01/mapping.json). A recovery bundle of the pre-rewrite refs is kept outside the repository (`Project/git-backups/campus-board-before-publication-20261101-104535/`, not published).

