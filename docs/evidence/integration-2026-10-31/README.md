# Integration run evidence — 2026-10-31

Branch `integrate/team-v1-20261031`, started from `main` `4ae9808`. Every entry names the task ID, the commit it was run on, the dataset and the environment. Only commands that were actually run are listed. No credentials, tokens or real databases are stored here.

## Environment (T02)

- macOS (Darwin 25.6.0), Node from the local install, dependencies as already installed in `node_modules` (not reinstalled).
- Real database `data/campus-board.sqlite` is **never** used by this run.
- Disposable integration database directory: `.demo-data/` (git-ignored, added in T02). Every integration server/seed sets `CAMPUS_BOARD_DB_PATH` to a file inside it and checks the resolved path first.
- Automated suites keep their own temporary databases: Playwright uses `$TMPDIR/campus-board-e2e-<timestamp>/e2e.sqlite` on port 3100; `scripts/verify-restart.sh` uses a `mktemp -d` database on port 3200.
- Ports 3000/3100/3200/3300 were free at T02 (checked with `lsof`); no foreign process was stopped.

Manual demo server (local only):

```bash
export CAMPUS_BOARD_DB_PATH="$PWD/.demo-data/team-demo.sqlite"
npm run db:seed-team-demo -- --yes   # added in T07; refuses data/campus-board.sqlite
npm run dev                          # http://localhost:3000
```

Admin credentials for that server come from the local `.env.local` (not recorded here).

## Log

| Task | Commit | Check | Result | Evidence file |
| --- | --- | --- | --- | --- |
| T01 | `201a006` | Source hash re-check vs. audit manifest | 67/67 identical, 0 missing, 0 unlisted | this file |
| T01 | — | `git commit --author="Name <>"` in a scratch repo | Accepted; `git fsck` clean | this file |
