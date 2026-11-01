# Independent review — room search and HCI lecturer

Date: **1 November 2026**. Reviewer: Codex. Base commit `452d893`, with Claude's uncommitted search changes. **One P2 finding remains open.** No application source, credentials or valued database was changed by this review; nothing staged, committed or pushed.

## SEARCH-R001 [P2] — Restore incoming URL state before mirroring local search state

Location: `src/components/public/RoomDirectory.tsx`, initial state at lines 68–72 and URL-writing effect at lines 79–88 in the reviewed version.

`query` and `date` read `useSearchParams()` only when the component mounts. On same-page navigation, including Back between language views, the component keeps its latest state. The effect sees the incoming URL and writes those latest values over it. The earlier search/date are therefore lost. The same mechanism undoes the bare `/rooms` navigation link's reset.

### Reproduced visitor sequence

1. Open `/rooms?suche=Chris&datum=2031-05-12` in German.
2. Click **English**.
3. Change the query to **Grosch** and the day to **2031-05-13**.
4. Use browser **Back**.

Expected: German view, **Chris**, **2031-05-12**, matching the previous history entry.

Actual: German view, **Grosch**, **2031-05-13**; the previous history entry is overwritten with the newer search/date.

A second probe then clicks the public navigation **Räume**, whose href is `/rooms`. Expected: unfiltered directory. Actual: the old search/date are immediately restored into the URL.

Both probes failed against the existing production build, with controlled public API fixtures and a disposable database on localhost port 3341. No admin login or real user data was involved. Evidence: [navigation-probe.json](../evidence/room-search-review-2026-11-01/navigation-probe.json), [screenshot](../evidence/room-search-review-2026-11-01/back-after-edit.png).

### Minimal correction and acceptance

- Make incoming router/history URL state authoritative on navigation, or otherwise distinguish navigation restoration from local typing. Avoid feedback loops and per-keystroke navigation.
- Preserve normal typing, clear/focus behaviour, date changes, polling stability and language-aware links.
- Add regressions for the sequence above and bare `/rooms` navigation. Cover Back/Forward across changed query/day/language and verify the URL as well as inputs and displayed results.
- Run the new regressions against this unchanged version first to establish failure, then against the correction. Existing six room-search tests must remain green.

This is one state-synchronization defect with two reproduced symptoms. It does not invalidate the seed update or the core room/name/lecturer matching.

## Checks actually performed

- Source and scoped diff inspection; original teammate imports were not changed by the reviewed diff.
- **Fresh `npm test`: 152/152 in 19 files, exit 0.**
- **Two additional navigation probes: 0/2 pass, exit 1**, both SEARCH-R001.
- **Read-only SQLite comparison**: current demo and its backup both pass integrity checks. Rooms (54), announcements (3), booking (1) and admin sessions (0) are identical. Only `instructor` and `updated_at` differ in the three intended HCI demo sessions; the new lecturer is Prof. Dr. Christian Zagel. No database was migrated or updated by this review.
- `git diff --check`: exit 0.

Claude's saved logs were read: typecheck/lint/build succeeded, 72 browser tests passed and restart verification passed 13 checks. **Those commands were not rerun by Codex in this review.** Browser probes used the existing production build, not a fresh independent build. Initial server launch was blocked by environment `EPERM`; the successful reproduction used normal tool approval. The temporary server was stopped afterwards.

Evidence and exact scope: [independent evidence index](../evidence/room-search-review-2026-11-01/README.md). Human usability, physical screen and second-device testing remain unperformed. Katja/Grosch office lookup and the kitchen label remain deferred.

## Next step

Correct SEARCH-R001 and reverify before treating the complete search milestone as accepted. T32 is reopened to IMPLEMENTED pending that correction; T33 remains IN_PROGRESS because office/staff lookup is still absent. Preserve Claude's original run and append correction evidence rather than rewriting its history.

## Correction status (appended by Claude Code, 1 November 2026)

The finding above is unchanged. SEARCH-R001 was corrected in the same uncommitted milestone; the regressions failed on the unfixed code and pass after the fix, and the full suite was rerun. See [correction evidence](../evidence/room-search-r001-fix-2026-11-01/README.md). Independent re-review by Codex has not happened yet.

## Independent correction recheck — 1 November 2026

Codex reran the original failing navigation scenarios against the corrected production build and added Forward/language/typing/clear checks: **7/7 pass, exit 0**. A fresh unit run passed **152/152 in 19 files, exit 0**. Source inspection confirms the URL-origin distinction and live language links. **SEARCH-R001 is resolved in this reviewed scope.** The original finding above remains as historical evidence.

[Independent recheck evidence](../evidence/room-search-r001-recheck-2026-11-01/README.md). Claude's full 75-browser/13-restart/build/lint/typecheck logs were read, not rerun independently. The fixed-slot test fixture collision remains a documented harness limitation and does not reopen the application finding. No runtime/data/credential changes, staging, commit or push by this recheck. Next: Ali's manual walkthrough; staff-office lookup, campus facts and human testing remain open.
