# Stage3 shared accessibility — implementation and independent completion

Date: 5 November 2026. Source base: `3d45bb7` on `integrate/v2-ali-parsa-20261104`, plus the code in this delivery. Claude Code implemented the shared Stage3 changes; Ali, assisted by Codex, completed review, fixes and independent validation. See [C14](../../contracts.md#c14-shared-accessibility-and-page-identity-v2-stage-3-al-05-2026-11-0405) and the [handoff](../../plans/v2-team-2026-11-03/07-stage-3-handoff.md).

## Implemented and reviewed

- First-stop skip link on shell pages; moves focus to main without changing history or triggering the pending-booking leave dialog.
- Document-language sync after hydration and reset to German when leaving the public component.
- Measured top focus clearance below the pinned room-floor bar; existing bottom-dock clearance retained.
- Distinct accessible room-action names, with visible label first and a hidden room code.
- Public placeholder contrast corrected; board `h1` and announcement `h2` with unchanged visual sizes; admin-preview heading levels retained.
- Logo links Home in the current language; exact ` – Campus Board` suffix on all public page titles, including cancellation.
- Audit validation runner propagates unexpected failures, refuses to overwrite an existing run and excludes all `.env*` files from its working copy.

No map geometry, booking logic, receipt/token/lifetime rule, API, database schema or Reza content change was made. The cancellation change is page metadata only. Original Aryan/Parsa contributions remain credited separately in the [contribution ledger](../../contributions.md).

## Independently executed completion checks

All application checks ran in a disposable local clone with its own `.next` and temporary test database, using the repository's Playwright configuration. They did not use the active app's database or credentials. Final runtime/test manifests of the actual checkout and tested copy are identical: **`8d715d5d320df408`, 199 files**. [Full source manifest](review-2026-11-05/runtime-manifest.txt).

| Check | Actual result | Evidence |
| --- | --- | --- |
| Strict cancellation title, before the product fix | 2 failures, DE and EN, at the old `LCC Campus Board` suffix | [Red log](review-2026-11-05/01-title-red.log) |
| Typecheck | exit 0 | [Log](review-2026-11-05/02-typecheck.log) |
| Whole-project lint | exit 0 | [Log](review-2026-11-05/03-lint.log) |
| Unit tests | 187/187 pass, exit 0 | [Log](review-2026-11-05/04-unit.log) |
| Production build | exit 0 | [Log](review-2026-11-05/05-build.log) |
| First full browser run | 178 pass / 2 fail: older cancellation-title assertions still required the old suffix | [Failure retained](review-2026-11-05/06-e2e.log) |
| Final full browser run, including production build | **180/180 pass**, exit 0, after correcting those two exact assertions; no tests skipped or loosened | [Final log](review-2026-11-05/08-e2e-final.log) |
| Restart persistence | **13 checks pass**, exit 0 | [Log](review-2026-11-05/09-restart.log) |
| Audit-runner probe | Original fails probe; fixed runner passes expected-red, positive-success, positive-failure and unexpectedly-green-baseline cases; existing-run refusal exits 3 and preserves its sentinel | [Probe results](review-2026-11-05/runner-red-green.txt) |
| Separate read-only code review | No actionable runtime regression found in the reviewed changes; no tests executed by that reviewer | [Scope and result](review-2026-11-05/independent-review.txt) |

The first full-run failure was an outdated test expectation exposed by an intentional title-contract change, not silently discarded evidence. `stage3-accessibility.spec.ts` and `parsa-review-fixes.spec.ts` now both require the exact common suffix. Other changed older assertions retain heading-level and contextual-link-name checks.

## Supplied Claude evidence and provenance limit

The original [measurement summary](measurements.md), [Reza packet](reza-packet.md), `before/`, `after/`, `final/` and [original logs](logs/) are retained. They cover five browser contexts in DE/EN. The original logs report 187 unit tests, 180 browser tests, 13 restart checks and seven deliberately broken variants caught by the new spec. Codex reran the complete positive suites above, **not** the entire seven-mutation sequence. The runner repair was tested separately through focused probes; its full red/build/mutation chain was not rerun after that tooling repair.

**Capture provenance correction:** raw capture JSON does not record a source commit. The original capture-generator comment/summary called the baseline `a089f73`; the handoff called it `3d45bb7`. Neither is asserted as the proven source of the raw captures. They evidence the recorded behaviours and measurements. Original validation logs separately stamp a `3d45bb7` baseline and matching working-tree/isolated-copy manifests; that does not retroactively stamp the captures. Only comments, generated-summary wording and explanatory records were corrected; original raw JSON and PNG files were preserved.

## Preservation and remaining work

- A pre-edit backup of all initially changed/untracked files is outside the repository. All 10 protected original env/data/manual-demo/build-ID files match their pre-edit hashes after validation; private hashes and values are not published here.
- Original PhaseA, V1, Stages1/2 and AP01 evidence was not regenerated in the active checkout. Test artifacts were created only in the isolated copy. No server on port 3000 was stopped or rebuilt.
- No Stage3 physical Elo, touch/USB, reach-height, native-keyboard, screen-reader, Firefox/WebKit or human acceptance run was performed. Browser emulation and accessibility-tree checks do not establish full accessibility conformance or a human usability improvement.
- English server HTML still carries root `lang="de"` before hydration; inner public content has the appropriate language. This accepted limitation remains visible in C14.
- AL-05's shared technical work is complete. AL-06 remains **partial** for owner content/facts and physical/human validation. Idle reset and the optional more-notices cue were not added.
- Ali explicitly deferred Booklet work. Its local files and the related short-test draft are excluded from this code delivery. No claim is made about completion of the team's report or rehearsal.
- Local commit preparation only: no push, merge or deployment by Codex. Ali controls publication.
