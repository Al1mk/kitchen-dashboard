# Independent review of integrated V1 — 2026-11-01

Reviewed by Codex for Ali, including a separate read-only code reviewer. Branch: `integrate/team-v1-20261031`, HEAD `c2933f6c72e2236bc51379632bec04488dd46fd0`, base `4ae9808`. The five commits after `64d2801` change documentation only; the runtime is the version Claude tested.

**Assessment:** the architecture and integration can stay. The existing acceptance suite passes independently, but two additional browser cases reproduce incorrect booking-receipt behaviour. Fix these before treating this as the final reviewed V1. No runtime fix, commit, push, merge or deployment was performed in this review.

## Findings

### V1-R001 — P2: a cancelled replay is shown as a saved reservation

Source: `src/components/public/BookingFlow.tsx:189–201`.

1. The visitor submits a booking; the server accepts it, but the response is lost.
2. Katja cancels that booking in the admin panel.
3. The visitor uses **Send again**, retrying the same request.
4. The API correctly replays the existing record with `status: "cancelled"`.
5. The client checks only the successful HTTP response and `booking.id`, then shows the green **Booking saved** receipt.

Impact: the visitor believes a cancelled reservation is active. The database conflict/cancellation rules remain correct; the feedback is wrong.

Evidence: the first test in `../evidence/review-2026-11-01/review-booking.spec.ts.txt` performed real API creation/cancellation/replay and failed at the final assertion: expected no active-success message, received one. See `new-probes-before-fix.log` in that folder.

Minimal correction: handle the returned booking status explicitly. A replayed cancelled record must say it is cancelled and must not be re-created or presented as active. Preserve idempotent retries and the existing occupancy rules. Add a regression for the complete sequence above.

### V1-R002 — P2: the receipt retains its original language after switching

Sources: `src/components/public/BookingFlow.tsx:195`, `src/components/public/BookingReceipt.tsx:14,51–52`.

1. Create a room with both German and English names.
2. Complete a booking in German and keep the receipt open.
3. Use the shared **English** switch.
4. Receipt labels and date change to English, but the room name remains German even though its English name exists. The fallback indication can also be wrong.

Cause: `localize(...)` runs once when constructing receipt state. The receipt stores the localized result instead of the two source names, so subsequent `lang` changes do not recalculate it.

Evidence: the second new browser test reached an English receipt heading but failed because the available English room name was absent.

Minimal correction: retain the original name fields in the receipt snapshot and localize them while rendering with the current language. Preserve the cancellation code, booking identity and current countdown while switching languages. Test DE → EN → DE and a room without an English name.

## Independent checks actually run

Tests used a `git archive HEAD` copy at `/private/tmp/hci-v1-review-2026-11-01-z_c5ngar`, a copied dependency directory and temporary databases. The real `.env.local` and `data/` were not copied.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0, no problems |
| `npm test` | 134/134 in 17 files, including the 3 separate-connection concurrency tests |
| Production build | Exit 0 |
| Existing browser suite, excluding the new review probes | 60/60, exit 0 |
| `bash scripts/verify-restart.sh` | PASS: 13 checks, exit 0 |
| Two new review probes on the unchanged application | 2/2 fail at the intended assertions above, exit 1 |
| Original source-package manifest | 67/67 hashes still match |
| Original `data/` files, before/after this review | All 3 checksums unchanged |
| Git history metadata | 20 commits ahead of local main; contributor import authors match the report; zero co-author trailers |

The first browser attempt stopped before tests because it could not download Google Fonts. A retry stopped during a build-process port operation. After clearing only the isolated generated `.next` cache and rebuilding with the necessary execution permissions, build, the full browser suite and restart succeeded. Failed-attempt logs are retained; these were not application assertion failures.

Logs, reproducible probes and exact run metadata: [`../evidence/review-2026-11-01/`](../evidence/review-2026-11-01/README.md). Unit/lint/typecheck results were captured by the execution tool; their stdout was not separately saved. Do not describe the failing new probes as a failure of the original 60-test suite.

## Documentation follow-up

- `docs/contributions.md` §5 currently lists adaptations only through T07, despite the handoff directing readers there for all integration fixes. Extend the ledger with the actual later Ali commits; do not invent an internal Aryan/Parsa split.
- The authoritative task board contains completed checkpoints, but the execution-plan step list still has **0 checked / 171 unchecked** steps. Reconcile only steps supported by evidence. Historical checkpoints remain historical.
- Preserve `64d2801` and its original screenshots. Record the two correctness fixes as a subsequent technical revision; they are not evidence of human-tested V2 improvements.
- Some V1 screenshots include rooms created by preceding automated tests (for example `ADMS-…` and `API-…` in the narrow map image). Before booklet/demo use, capture a separate clean, seeded demo series. Do not overwrite the historical screenshots or treat fixture rooms as campus facts.

## Next work and ownership

1. **Ali / Claude:** fix V1-R001 and V1-R002 with targeted regressions, rerun relevant checks, then record the new technical revision and reconcile the documentation above. Keep the architecture and existing contracts; no teammate-module rewrite is needed.
2. **Ali:** publish the reviewable integration branch when desired. This review did not attempt a push or verify the current remote state; the earlier permission denial is Claude's reported result. Do not merge main or deploy as part of the two fixes.
3. **Aryan + Parsa:** confirm joint authorship wording or supply the actual split; review map/booking behaviour and room/floor accuracy.
4. **Reza:** provide measured/observed screen specifications, sourced newcomer information and a verified help destination.
5. **Team:** verify current Moodle dates and format, then run and honestly record U1–U6 with people. Continue selected V2 changes and retesting from those observations; complete individual booklet sections and rehearse the short demonstration.

No physical screen, second-device/LAN test or human usability study was performed here. No verified campus floor plan, real timetable or official help contact was supplied by this review. The green technical checks do not establish examination readiness or measured usability improvement.

## Scoped handoff to Claude

Read this review, `docs/hci/review-handoff.md`, the authoritative progress board and project instructions. Address only V1-R001 and V1-R002 first. Copy the two review probes into the active test suite as appropriate and reproduce their failures before editing runtime code. Keep traces, video and screenshots off for credential-bearing tests; also suppress Playwright's automatic page snapshot (`PLAYWRIGHT_NO_COPY_PROMPT=1` in this installed version), or otherwise prevent credentials entering failure artifacts. Fix the underlying state handling without changing booking policy, atomic conflict guards or the database model. Extend the language regression to both directions and missing translations. Run relevant checks, update contribution/progress/HCI evidence records and Persian vault notes, clearly separating the technical correction from later human-tested V2. Preserve original source imports and V1 evidence. Do not push, merge or deploy in this fix scope.

## Independent follow-up — corrections verified, 2026-11-01

Reviewed HEAD `c7b915999373be8a18ecb81f07426a5f1bbecbbd`; runtime correction commit `9144cff`. `83efaac` preserved the original review/evidence, and `c7b9159` is documentation. The findings and original failed-test evidence above remain historical.

**V1-R001 and V1-R002 are closed within their stated technical acceptance scope.** No further defect was found in this focused correction review.

- R001: successful responses settle only for a named booking in `confirmed` or `cancelled` state. A cancelled replay has a distinct translated warning state, hides the cancellation code and creates no replacement booking. Unknown responses retain the identical request for retry.
- R002: the receipt keeps both source room names and localizes them while rendering. The regressions exercise DE → EN → DE, missing English fallback, stable booking identity/code, no resubmission and continuing countdown, plus More time/expiry. The cancelled-state language switch is covered too.
- New local verification on a `git archive HEAD` copy with fresh temporary databases: **136/136 unit tests**, including three concurrency cases; **13/13 relevant browser tests** (the two original probes and booking pending/language/cancellation cases); typecheck and lint exit 0. The browser command includes the configured production build, which succeeded. Original `.env.local` and `data/` were not copied; checksums of all three original data files remained unchanged.
- Claude's complete **66/66 browser** and **restart PASS 13** logs were inspected, but those two complete checks were **not rerun** by this follow-up. No API, database, policy or server code changed in the correction. Do not replace that distinction with an independent full-suite claim.
- The contribution ledger now covers later adaptations; the plan has 125 checked / 46 open steps, with human work still open. Fourteen separate clean demo screenshots exist; the inspected narrow-map image has no prior test-fixture rooms. These remain simulated browser views, not physical-screen evidence.
- The reported temporary-test-code disclosure in a red-run log is explicitly marked as redacted. A scan of the committed correction logs found no exact 43-character base64url token values or literal token/Bearer assignments. This is a limited check, not a claim about every possible secret. No production credential change is implied.

Fresh evidence: [`../evidence/review-2026-11-01/corrected-verification/run-info.json`](../evidence/review-2026-11-01/corrected-verification/run-info.json) and adjacent logs. No runtime edit, commit, push, merge or deployment was performed by Codex in this follow-up. Remote state was not independently checked here.

Next: publish the reviewed integration branch for team access when Ali chooses, then run the first real U1–U6 sessions on `v1-corrected`. Reza's screen/source facts, map accuracy, joint authorship details and current Moodle requirements remain open. V2 selection/retest and booklet completion follow the actual observations.
