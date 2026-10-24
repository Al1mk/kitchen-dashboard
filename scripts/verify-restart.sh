#!/bin/bash
# Restart persistence check (production build, temporary database): publish an
# announcement, save an unpublished draft edit, stop the server, start it again and
# assert that the public output, the admin state and the session are unchanged.
# Every request must return the expected HTTP status; any failure or mismatch
# exits non-zero. Needs a prior `npm run build`. Never touches data/.
set -euo pipefail
APP="${1:-$(cd "$(dirname "$0")/.." && pwd)}"; cd "$APP"
TMP=$(mktemp -d); DB="$TMP/restart.sqlite"; PORT=3200; BASE="http://localhost:$PORT"; J="$TMP/jar"; SRV=""; CHECKS=0

cleanup() { if [ -n "$SRV" ]; then kill "$SRV" 2>/dev/null || true; wait "$SRV" 2>/dev/null || true; fi; rm -rf "$TMP"; }
trap cleanup EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }
check() { # check <label> <expected> <actual>
  [ "$2" = "$3" ] || fail "$1: expected '$2', got '$3'"
  CHECKS=$((CHECKS + 1)); echo "ok   $1: $3"
}
# req <label> <expected-status> <curl args...>: prints the body; fails on any other status.
# The label is used in messages instead of the arguments, so no password is ever printed.
req() {
  local label=$1 want=$2 code; shift 2
  code=$(curl -sS -o "$TMP/body" -w '%{http_code}' "$@") || fail "$label: request failed"
  [ "$code" = "$want" ] || fail "$label: HTTP $code (expected $want)"
  cat "$TMP/body"
}
# jget <js expression over d>: evaluates a fixed expression from this script (never
# external input) against JSON read from stdin.
jget() { node -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); const v=eval(process.argv[1]); console.log(typeof v==="string"?v:JSON.stringify(v))' "$1"; }
up() { curl -s -o /dev/null "$BASE/api/public/announcements"; }

start() {
  CAMPUS_BOARD_DB_PATH="$DB" ADMIN_USERNAME=restart-admin ADMIN_PASSWORD_HASH="$HASH" \
    node_modules/.bin/next start -p "$PORT" >>"$TMP/server.log" 2>&1 & SRV=$!
  for _ in $(seq 1 60); do up && return 0; kill -0 "$SRV" 2>/dev/null || break; sleep 0.5; done
  fail "server did not start (log: $(tail -5 "$TMP/server.log"))"
}
stop() {
  kill "$SRV"; wait "$SRV" 2>/dev/null || true; SRV=""
  ! up || fail "server still answering after stop"
}

[ -f .next/BUILD_ID ] || fail "no production build; run npm run build first"
! up || fail "port $PORT is already in use; refusing to test a foreign server"
PW=$(node -e 'console.log(require("crypto").randomBytes(18).toString("base64url"))')
HASH=$(PW="$PW" node --input-type=module -e 'import {hashPassword} from "./src/lib/auth/password.ts"; console.log(await hashPassword(process.env.PW))')
H=(-H "Origin: $BASE" -H 'Content-Type: application/json')
PUBLISHED='{"title":"Neustart-Test","body":"Bleibt nach Neustart erhalten.","category":"general","pinned":false,"startsAt":"","endsAt":""}'
DRAFT_TITLE="Neustart-Test (unveröffentlichter Entwurf)"
DRAFT="{\"title\":\"$DRAFT_TITLE\",\"body\":\"x\",\"category\":\"general\",\"pinned\":false,\"startsAt\":\"\",\"endsAt\":\"\"}"

echo "# Restart persistence check $(TZ=Europe/Berlin date '+%Y-%m-%d %H:%M %Z') (production build, temp DB)"
start; PID1=$SRV; echo "server 1 started (pid $PID1)"
req login 200 -c "$J" "${H[@]}" -d "{\"username\":\"restart-admin\",\"password\":\"$PW\"}" "$BASE/api/auth/login" >/dev/null
ID=$(req create 201 -b "$J" "${H[@]}" -d "$PUBLISHED" "$BASE/api/admin/announcements" | jget 'd.announcement.id')
echo "created: $ID"
req publish 200 -b "$J" "${H[@]}" -X POST "$BASE/api/admin/announcements/$ID/publish" >/dev/null
req "save draft edit" 200 -b "$J" "${H[@]}" -X PUT -d "$DRAFT" "$BASE/api/admin/announcements/$ID" >/dev/null

PUBLIC_BEFORE=$(req "public before" 200 "$BASE/api/public/announcements" | jget 'd.announcements')
check "public titles before restart" '["Neustart-Test"]' "$(echo "$PUBLIC_BEFORE" | jget 'd.map(a=>a.title)')"
ADMIN_Q='`status=${d.announcement.status} pending=${d.announcement.hasPendingChanges} draft=${d.announcement.draft.title}`'
ADMIN_EXPECTED="status=published pending=true draft=$DRAFT_TITLE"
check "admin state before restart" "$ADMIN_EXPECTED" "$(req "admin before" 200 -b "$J" "$BASE/api/admin/announcements/$ID" | jget "$ADMIN_Q")"

stop; echo "server 1 stopped (port $PORT no longer answers)"
start; echo "server 2 started (pid $SRV)"
[ "$SRV" != "$PID1" ] || fail "server 2 has the same pid as server 1"

check "public output after restart (full JSON, unchanged)" "$PUBLIC_BEFORE" "$(req "public after" 200 "$BASE/api/public/announcements" | jget 'd.announcements')"
req "old session after restart (GET admin list)" 200 -b "$J" "$BASE/api/admin/announcements" >/dev/null
CHECKS=$((CHECKS + 1)); echo "ok   old session after restart: HTTP 200"
check "admin state after restart" "$ADMIN_EXPECTED" "$(req "admin after" 200 -b "$J" "$BASE/api/admin/announcements/$ID" | jget "$ADMIN_Q")"

stop
echo "PASS: $CHECKS checks"
