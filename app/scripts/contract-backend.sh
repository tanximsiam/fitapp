#!/usr/bin/env bash
# Starts a throwaway FitApp backend for the API contract tests and keeps it running in the foreground.
# Fresh SQLite database in a temp folder, one test user with a random password, the sample ingest payload.
# Your own backend database and .env are not touched (real environment variables override .env).
#
#   scripts/contract-backend.sh &        # then: npm run test:contract
#
set -euo pipefail

BACKEND="${FITAPP_BACKEND_DIR:-$(cd "$(dirname "$0")/../../backend-fitapp" && pwd)}"
PORT="${PORT:-8010}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/.contract.env"
TMP="$(mktemp -d)"
EMAIL=contract@fitapp.test
PASSWORD="$(openssl rand -hex 16)"

export DB_CONNECTION=sqlite DB_DATABASE="$TMP/contract.sqlite" CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync
touch "$DB_DATABASE"
cd "$BACKEND"

php artisan migrate --force --no-interaction -q
CONTRACT_PASSWORD="$PASSWORD" php artisan tinker --execute \
  "\App\Models\User::create(['name' => 'Contract Test', 'email' => '$EMAIL', 'password' => \Illuminate\Support\Facades\Hash::make(getenv('CONTRACT_PASSWORD'))]);" >/dev/null
INGEST="$(php artisan fitapp:ingest-token "$EMAIL" --name=contract | tail -n 1)"

php artisan serve --port="$PORT" --no-reload >"$TMP/serve.log" 2>&1 &
SERVER=$!
# Credentials only exist while the server runs, so a stopped server means skipped tests, not failed ones.
trap 'kill $SERVER 2>/dev/null; rm -rf "$TMP" "$OUT"' EXIT
for _ in $(seq 50); do curl -sf "http://127.0.0.1:$PORT/up" >/dev/null && break; sleep 0.2; done

curl -sf -X POST "http://127.0.0.1:$PORT/api/ingest" -H "Authorization: Bearer $INGEST" -H 'Content-Type: application/json' -H 'Accept: application/json' \
  --data @"$BACKEND/../docs/examples/ingest-sample.json" >/dev/null

printf 'FITAPP_CONTRACT_URL=http://127.0.0.1:%s\nFITAPP_CONTRACT_EMAIL=%s\nFITAPP_CONTRACT_PASSWORD=%s\n' "$PORT" "$EMAIL" "$PASSWORD" >"$OUT"
echo "Contract backend on http://127.0.0.1:$PORT (credentials in .contract.env). Ctrl+C to stop."
wait $SERVER
