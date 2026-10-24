#!/bin/bash
# Restart persistence check: publish via API, stop server, start again, read public API.
set -u
APP="${1:-$(cd "$(dirname "$0")/.." && pwd)}"; cd "$APP"
TMP=$(mktemp -d); DB="$TMP/restart.sqlite"; PORT=3200; BASE="http://localhost:$PORT"
PW=$(node -e 'console.log(require("crypto").randomBytes(18).toString("base64url"))')
HASH=$(PW="$PW" node --input-type=module -e 'import {hashPassword} from "./src/lib/auth/password.ts"; console.log(await hashPassword(process.env.PW))')
start() { CAMPUS_BOARD_DB_PATH="$DB" ADMIN_USERNAME=restart-admin ADMIN_PASSWORD_HASH="$HASH" npx next start -p $PORT >"$TMP/server.log" 2>&1 & SRV=$!; for i in $(seq 1 60); do curl -sf "$BASE/api/public/announcements" >/dev/null && return; sleep 0.5; done; echo "server did not start"; exit 1; }
echo "# Restart persistence check $(TZ=Europe/Berlin date '+%Y-%m-%d %H:%M %Z') (production build, temp DB)"
start; echo "server 1 started (pid $SRV)"
J="$TMP/jar"
curl -s -c $J -H "Origin: $BASE" -H 'Content-Type: application/json' -d "{\"username\":\"restart-admin\",\"password\":\"$PW\"}" $BASE/api/auth/login -o /dev/null -w "login: %{http_code}\n"
ID=$(curl -s -b $J -H "Origin: $BASE" -H 'Content-Type: application/json' -d '{"title":"Neustart-Test","body":"Bleibt nach Neustart erhalten.","category":"general","pinned":false,"startsAt":"","endsAt":""}' $BASE/api/admin/announcements | node -pe 'JSON.parse(require("fs").readFileSync(0)).announcement.id')
echo "created: $ID"
curl -s -b $J -H "Origin: $BASE" -X POST $BASE/api/admin/announcements/$ID/publish -o /dev/null -w "publish: %{http_code}\n"
curl -s -b $J -H "Origin: $BASE" -H 'Content-Type: application/json' -X PUT -d '{"title":"Neustart-Test (unveröffentlichter Entwurf)","body":"x","category":"general","pinned":false,"startsAt":"","endsAt":""}' $BASE/api/admin/announcements/$ID -o /dev/null -w "save draft edit: %{http_code}\n"
echo "public before restart: $(curl -s $BASE/api/public/announcements | node -pe 'JSON.parse(require("fs").readFileSync(0)).announcements.map(a=>a.title).join(" | ")')"
kill $SRV; wait $SRV 2>/dev/null; echo "server 1 stopped"
start; echo "server 2 started (pid $SRV)"
echo "public after restart:  $(curl -s $BASE/api/public/announcements | node -pe 'JSON.parse(require("fs").readFileSync(0)).announcements.map(a=>a.title).join(" | ")')"
echo "old session after restart (GET admin list): $(curl -s -b $J $BASE/api/admin/announcements -o /dev/null -w '%{http_code}')"
echo "admin state after restart: $(curl -s -b $J $BASE/api/admin/announcements/$ID | node -pe 'const a=JSON.parse(require("fs").readFileSync(0)).announcement; `status=${a.status} pending=${a.hasPendingChanges} draft="${a.draft.title}"`')"
kill $SRV; wait $SRV 2>/dev/null; rm -rf "$TMP"; echo "done"
