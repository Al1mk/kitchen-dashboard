# Stage 1 baseline — what "before" is, and the state of everything that must not change

Recorded 3 November 2026 (Europe/Berlin) at the start of Stage 1, before any source edit.

## Source

| Item | Value |
| --- | --- |
| Branch / HEAD | `main` at `a7903db` ("Ali part: add room search and fix SEARCH-R001 navigation"); no stash entries |
| Uncommitted **runtime** edits at the start | none: `git diff --name-only HEAD` over `src`, `tests`, `scripts`, `public`, `package.json`, `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `vitest.config.mts` listed 0 files |
| Uncommitted documentation at the start (preserved, not touched except where stated) | `README.md`, `docs/evidence/README.md`, `docs/hci/booklet/outline.md`, `docs/hci/change-log.md`, `docs/hci/heuristic-evaluation.md`, `docs/hci/presentation/outline.md`, `docs/hci/research/screen-specs.md`, `docs/hci/v2-decisions.md`, `docs/plans/team-integration-2026-10-31/02-progress.md`; untracked: `.claude/.headroom_wrap_settings.lock` (left alone, must stay uncommitted), `audit-artifacts/`, `docs/evidence/field-review-2026-11-02/`, `docs/evidence/v2-audit-2026-11-03/`, `docs/hci/requests/2026-11-02-physical-kiosk-review.md`, `docs/hci/v2-audit-2026-11-03/`, `docs/plans/v2-team-2026-11-03/` |
| Runtime-manifest hash of the V1 baseline | `982e061e09055b64` (SHA-256 of the sorted per-file SHA-256 list of `src`, `public`, `scripts`, `tests`, `package.json`, `package-lock.json`, `next.config.ts`). Identical for the working tree and the isolated V1 copy |
| Runtime-manifest hash after Stage 1 | `ea6c27d32152c5bc` (same method; working tree and the validated copy equal) |

## "Before" evidence

The "before" set in `before/` was captured from an **isolated copy of that exact V1 source** (production build, own `.next`, `127.0.0.1:3401`, fresh disposable database), with the same script, contexts, languages and synthetic data as the "after" set. It does not come from Ali's running server or `.next`. The earlier V2 audit screenshots (`docs/evidence/v2-audit-2026-11-03/`) are untouched.

## Protected state (not touched; checked again at the end)

| Item | State at start |
| --- | --- |
| Servers | nothing listening on 3000, 3100 or 3400; Ali's `.next` last built 2 Nov 08:53 and not rebuilt |
| `data/campus-board.sqlite` (+wal) | 4,096 B / 325,512 B, last modified 25 Oct / 2 Nov 08:51 |
| `.demo-data/ali-manual-2026-11-01.sqlite` (+wal) | 86,016 B / 8,272 B, last modified 1 Nov 12:49 / 2 Nov 09:07; Ali's manual test work; **not reseeded** |
| `.env.local` | 220 B, last modified 25 Oct; contents never read |
| Credentials | the isolated servers use a random temporary admin password written to a mode-600 file in the session scratch folder and deleted at the end; none is in the repository or in any evidence file |

## Physical display (AL-01, physical part)

Read-only check on the Mac that ran Stage 1: **0** USB entries mentioning an Elo device, **1** display (the built-in one). The Elo ET4363L / E344056 was **not attached**, so no viewport, zoom, DPR, pointer media, mounting height, reach or touch measurement was possible. Nothing was installed or changed, and no serial number or system inventory was collected. **T35 stays WAITING_HUMAN; the NOT VERIFIED rows in `docs/hci/research/screen-specs.md` are unchanged.** Browser emulation is not a hardware test.

## Tools

Node v22.20.0, Next 16.4.3, Playwright 1.64.1 with headless Chromium 156.0.8078.4 (Chromium only; Firefox and WebKit are not installed and were not run), macOS arm64.
