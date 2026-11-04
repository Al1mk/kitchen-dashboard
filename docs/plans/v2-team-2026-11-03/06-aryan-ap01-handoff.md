# Claude continuation after Aryan AP01

Stand: 4 November 2026. Read this together with Project/CLAUDE.md, AGENTS.md, the canonical vault HCI00/09/latest05/31/32, docs/contracts.md C10–C13 and the authoritative task board. This is a handoff, not permission to push or claim Stage3 complete.

## Accepted local integration

The prior accepted base is a089f73 (Ali kiosk Stages1/2 plus Parsa V2 and the earlier independent review fixes). Aryan's original AP01 is imported as9b6eaba, then Ali/Codex repair it in39a7d8d. Stack, schema, stable room IDs, positions, APIs, booking tokens/lifetimes and occupancy checks stay unchanged.

Map details:
- Actual rendered hit sizes are measured from probes sharing the visible rem-based classes. Grouping cannot assume72/44px at a22px root.
- Group selection does not move stored room coordinates. Legacy rename/floor tests now accept an ID inside a group and still verify hiding stale floor positions.
- Close restores related focus; chooser selection focuses details. Stable React19 callback-ref cleanup handles focus before an involuntary subtree removal. Invalid group state is discarded, preventing reopen/focus theft when a room is restored. Do not replace this with a late layout-effect cleanup: the real regression demonstrated that activeElement was already BODY there.
- English chooser names use the existing FallbackTag policy.

Final actual checks, prior red runs and source manifest: `docs/evidence/aryan-ap01-fix-2026-11-04/README.md`. Read it; do not reuse an earlier count as a new run. Human/Elo/screen-reader results remain absent.

## Preserve unfinished Stage3

The active checkout already had12 dirty Stage3 files before this task. Their bytes are recorded in `stage3-preserved.json`; a private full backup/diff also exists outside the repository. This integration does not include or certify them. The reviewed commits were prepared in a separate clone, avoiding the active .next, credentials and databases.

When Ali sends the Stage3 result:
1. Inspect `git status`, current HEAD and those uncommitted files. Compare with the Stage3 handoff and saved hashes, without restoring older files over newer work.
2. Review Stage3 source/evidence and reconcile `PublicShell`, document language, skip link, Rooms focus/scroll and board behaviour against the accepted C10–C13 contracts.
3. Build/test an isolated combined copy of **the actual final Stage3 working source**. Do not call the current AP01 checks proof for Stage3. Keep source provenance and disclose any harness changes.
4. If the combined version passes, update records and commit only reviewed files as `Ali part: ...`. No `git add .` while unrelated work exists. No remote push without Ali's new instruction; he currently plans to push himself.

## Presentation and report

`docs/hci/presentation/v2/` contains an editable five-slide deck, offline PDF, German Reza script, source/image manifests and validation receipt. Every rendered final slide was inspected. Microsoft PowerPoint application check, team approval and rehearsal are still pending. Deck status explicitly leaves Stage3 and human/Elo acceptance open; update only when supported by actual new evidence.

`docs/hci/booklet/aryan-ap01/` contains a source-based five-page DOCX/Markdown/PDF working draft for Aryan. He must approve his personal account. This does not complete the four-person booklet. No survey answers/participant counts/times were invented. Reza's original chapter/content is preserved.

Next owners: Ali reviews Stage3 and final integration; Aryan approves map/chapter/deck; Parsa rehearses a short free-slot demo and checks receipt privacy; Reza verifies facts/Moodle, assembles individual approved chapters and rehearses the presentation. Actual outside-user testing and Elo touch/reach remain team work.

## Git rules

Exactly `al1mk <alimk1752@gmail.com>` for author AND committer. Human contribution names go in subjects and docs/contributions.md, not fabricated teammate emails. No AI co-author/Generated-with/session trailers. Honest AI use stays in documentation. Never stage env/DB/cancellation credentials/Headroom lock, rewrite shared history, overwrite teammate work, push or merge main automatically.
