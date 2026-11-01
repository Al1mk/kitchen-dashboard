# Publication preparation — 1 November 2026 (Europe/Berlin)

Executed by Claude Code for Ali. Local only: **nothing was pushed**; Ali pushes the branch himself.

| Step | Result |
| --- | --- |
| Remote before the rewrite (`git ls-remote origin`, 2026-11-01 ~10:45) | only `refs/heads/main` = `4ae9808edec4348f116d2d536c84eb05af151e27`; no integration branch, no tags |
| Recovery backup (outside the repository, not published) | `Project/git-backups/campus-board-before-publication-20261101-104535/`: `git bundle --all` (verified; a clone restored both refs), patches of uncommitted work, untracked review evidence, ref list, pre-rewrite commit metadata |
| Pending review work committed | `6ca7e40` → after rewrite `b1e89f2` (`Ali part: record independent verification of corrected V1`) |
| Identity | repository-local `user.name=al1mk`, `user.email=alimk1752@gmail.com`; no `GIT_AUTHOR_*`/`GIT_COMMITTER_*` overrides, no hooks, no trailer config; `.claude/settings.json` keeps empty commit/PR attribution and `sessionUrl: false` |
| Rewrite | 24 commits `4ae9808..6ca7e40` rebuilt with `git commit-tree` (same tree, mapped parents, original author/committer dates); [`mapping.json`](mapping.json), [`../../history-mapping-2026-11-01.md`](../../history-mapping-2026-11-01.md) |
| Per-commit verification | 24/24: tree identical, parents mapped, order identical, author and committer dates identical, identity exact, unsigned, no prohibited lines; messages identical except the three import subjects/provenance note; `main` unchanged |
| Tip equivalence | old tip `6ca7e40` and new tip `b1e89f2` share tree `9c2f462122e35806733cdc93f63c153ae4800c13`; raw `git diff` between them: 0 lines |
| Lightweight checks on the unchanged runtime ([`checks-run-info.txt`](checks-run-info.txt)) | typecheck exit 0, lint exit 0, unit 136/136 (18 files) |

Not rerun here, because no runtime or test file changed: production build, the 66-test browser suite and the restart check. Their latest results (Claude, code `9144cff` = `27ef96b`: E2E 66/66, restart PASS 13) and Codex's follow-up (136/136 unit, 13/13 relevant browser tests incl. build) apply to the identical tree. A fresh-clone run of the published branch is planned after Ali's push.
