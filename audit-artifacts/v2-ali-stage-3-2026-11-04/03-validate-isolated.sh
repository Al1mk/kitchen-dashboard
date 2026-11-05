#!/bin/bash
# Stage 3 validation chain (4 Nov 2026), run on ISOLATED copies. Tooling only, not product code.
#
#   bash 03-validate-isolated.sh <work-dir>
#
# What it does, in order (each step logs to <work-dir>/logs and keeps going if a step fails; the exit codes are in
# <work-dir>/progress.txt):
#   1. copies the ACTUAL working tree (incl. uncommitted Stage 3 files) and, separately, a clean `git archive HEAD` copy
#      (the "before" baseline) into <work-dir>; each gets its own node_modules clone and its own .next, never the project's
#   2. red:    the new Stage 3 spec against the HEAD baseline                       (expected: fails, that is the point)
#   3. typecheck, whole-project lint (live tree), unit tests, full E2E with the project's OWN playwright.config.ts
#      (port 3100, production build, disposable database, random temporary admin credential), restart check (port 3200)
#   4. seven mutation checks (04-mutations.mjs)
# It never starts a server on 3000, never touches data/, .demo-data/, .env.local, credentials or the project's .next,
# and refuses to run if 3100 or 3200 is already in use. It stops only processes it started.
set -eu
WORK="${1:?usage: bash 03-validate-isolated.sh <work-dir>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
if [[ -e "$WORK/after" || -e "$WORK/before" || -e "$WORK/progress.txt" ]]; then
  echo "refusing to overwrite an existing validation run: $WORK" >&2
  exit 3
fi
mkdir -p "$WORK/logs"
PROGRESS="$WORK/progress.txt"
: > "$PROGRESS"
FAILURES=0
step() { echo "$(date '+%H:%M:%S') $*" >> "$PROGRESS"; }

for p in 3100 3200; do
  if lsof -nP -iTCP:$p -sTCP:LISTEN > /dev/null 2>&1; then echo "port $p is in use; refusing to run" | tee -a "$PROGRESS"; exit 3; fi
done

EXCLUDES=(--exclude=.git --exclude=node_modules --exclude=.next --exclude=data --exclude=.demo-data --exclude='.env*' --exclude=docs --exclude=audit-artifacts --exclude=.claude --exclude=test-results --exclude=playwright-report --exclude=.vitest --exclude=tsconfig.tsbuildinfo)

step "copy: working tree -> after"
mkdir -p "$WORK/after" "$WORK/before"
rsync -a "${EXCLUDES[@]}" "$REPO/" "$WORK/after/"
cp -cR "$REPO/node_modules" "$WORK/after/node_modules"
step "copy: git archive HEAD -> before"
git -C "$REPO" archive HEAD src public scripts tests package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs vitest.config.mts playwright.config.ts | tar -x -C "$WORK/before"
cp -cR "$REPO/node_modules" "$WORK/before/node_modules"
{
  echo "live tree : $(node "$HERE/00-manifest.mjs" "$REPO")"
  echo "after copy: $(node "$HERE/00-manifest.mjs" "$WORK/after")"
  echo "before    : $(node "$HERE/00-manifest.mjs" "$WORK/before")  (git HEAD $(git -C "$REPO" rev-parse --short HEAD))"
} > "$WORK/logs/00-manifests.txt"
cp "$REPO/tests/e2e/stage3-accessibility.spec.ts" "$WORK/before/tests/e2e/"

run() { # run <name> <cwd> <command...>
  local name=$1 cwd=$2; shift 2
  local result
  step "start $name"
  if (cd "$cwd" && NO_COLOR=1 PLAYWRIGHT_NO_COPY_PROMPT=1 "$@" > "$WORK/logs/$name.log" 2>&1); then
    result=0
  else
    result=$?
  fi
  printf '\nEXIT %s\n' "$result" >> "$WORK/logs/$name.log"
  step "done  $name: EXIT $result"
  # Only the red-first check is expected to fail. A failing positive check or an
  # unexpectedly green baseline must make this runner fail, not just its logs.
  if [[ "$name" == "01-red-before-head" ]]; then
    if [[ "$result" -eq 0 ]]; then FAILURES=$((FAILURES + 1)); fi
  elif [[ "$result" -ne 0 ]]; then
    FAILURES=$((FAILURES + 1))
  fi
}

run 01-red-before-head "$WORK/before" node node_modules/@playwright/test/cli.js test tests/e2e/stage3-accessibility.spec.ts --reporter=list
run 02-typecheck "$WORK/after" bash -c "node node_modules/next/dist/bin/next typegen && node node_modules/typescript/bin/tsc --noEmit"
run 03-lint-live-tree "$REPO" node node_modules/eslint/bin/eslint.js
run 04-unit "$WORK/after" node node_modules/vitest/vitest.mjs run
run 05-e2e-full "$WORK/after" node node_modules/@playwright/test/cli.js test --reporter=list
run 06-restart "$WORK/after" bash scripts/verify-restart.sh "$WORK/after"
run 07-mutations "$WORK" node "$HERE/04-mutations.mjs" "$WORK/after" "$WORK"
if [[ "$FAILURES" -ne 0 ]]; then
  step "FAILED: $FAILURES unexpected check results"
  exit 1
fi
step "ALLDONE: expected red baseline and all positive checks passed"
