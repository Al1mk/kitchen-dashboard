# V2 integration handoff — 4 November 2026

**Code/evidence checkpoint:** `5f8dda9` on local `integrate/v2-ali-parsa-20261104`, based on `a7903db`. Author and committer: `al1mk <alimk1752@gmail.com>`. Parsa’s source proposal and Ali’s adaptations are named in the commit and `docs/contributions.md`; no AI co-author trailer. No push/merge/deployment performed.

## What is now integrated

Ali’s Stages1/2: bottom 4+3 dock/scale/space reservation, large Home cards/pictograms, compact Newcomers layout with Reza’s content unchanged, Rooms floor jumps/action row/result ordering. Parsa’s delivered V2: receipt acknowledgement, link leave dialog, same-page language retention, review/receipt scroll, code show/hide, concise DE/EN copy and schedule→booking CTA preserving stable room/day/language. Ali/Codex corrected R001–R006, including stable warning and both action buttons at narrow kiosk size, invalid-room cache/recovery, EN cancellation metadata, literal-entry hints and the falsely labelled photo citation. No backend or token/lifetime change.

[Final evidence](../../evidence/v2-integration-2026-11-04/README.md): 189source/config files matched; typecheck/lint pass,166unit,145E2E and13restart checks pass; four visual contexts/36masked screenshots. Fail-before/pass-after and the screenshot-discovered Done obstruction are recorded. [C12](../../contracts.md#c12-combined-parsa-v2-integration-2026-11-04), [source provenance](../../team-sources/parsa-v2/README.md), [contributions](../../contributions.md). Protected env/manual data/original build untouched. Historical evidence retained; terminal colour warnings are environmental.

The map-position test passed both complete runs and20fresh repetitions, but historical intermittency is still open; no map assertion was loosened or skipped.

## Next Claude task: Stage3 only

Read the Common instructions and Stage3 in [Ali prompts](02-ali-claude-prompts.md), Stage1/2 handoffs, this handoff, current code/contracts and the canonical Persian vault’s latest HCI00/05/09/28/29/30. The outside-repository `Project/HANDOFF-2026-11-04-V2.md` carries the final READY marker and exact Git state for a compacted/new session. Do not rely on claude-mem or reapply Parsa’s installer/full ZIP.

Complete only remaining shared accessibility and readiness work: skip link, meaningful focus clearance around the floor chips/dock, document language and remaining metadata, useful link names/board heading/readable states; truthful evidence and Ali’s own booklet draft. Cancellation title and the schedule404 state are already done. The earlier instruction to hand Parsa these known fixes back was superseded by Ali’s explicit4November authorization; do not redo them or change their attribution.

Keep the stack/schema/API, stable IDs, DE/EN public and German admin, current design/brand, privacy, memory-only receipt and timing policy. Preserve search/history and guards; no new feature expansion. Relevant skills and installed Next docs only; no blind run of every installed skill or new installation. Build/test in a disposable copy, not an active manual server’s `.next`. Update actual evidence and Persian vault. Claude Stage3 must **not** automatically stage/commit/push; stop for review.

## Team/human work still open

- Aryan: AP01 map-marker size/overlap/selection; deck owner with Parsa assets. Do not claim a new map delivery exists.
- Parsa: own chapter, review/user-check of module and deck assets; do not relabel Ali’s corrections as original delivered work.
- Reza: concise verified content/facts, actual device/user coordination, editorial work and presentation.
- All: genuine users, individual minimum-five-page contributions, final deck/rehearsal and Moodle/date confirmation. No person’s results may be invented.
- Elo ET4363L/E344056 configured1080×1920@60/90°; browser viewport/reach/working touch/native keyboard remain unmeasured. No driver/system change was attempted.

## Ali’s manual run and publication

Use the [V2 walkthrough](../../run-guide.md#v2-integration-walkthrough-4-november-2026): a fresh disposable DB name, rebuild after stopping any server from this checkout, port3001 in the example. The old `.next` was deliberately not rebuilt in place during Codex validation.

When ready, publish this feature branch yourself:

```bash
git push -u origin integrate/v2-ali-parsa-20261104
```

This does not update main. Create/review the pull request separately after the intended manual check; no force push is required.
