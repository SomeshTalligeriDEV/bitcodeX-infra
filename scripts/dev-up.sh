#!/usr/bin/env bash
# Start the local BitcodeX stack:
#   containers: Postgres (3 DBs) + Subtensor localnet       (scripts/local/docker-compose.local.yml)
#   host:       bitcodex_api :4200, key share nodes :4201 :4202, iframe :3201, demo_web :3200
# Logs: ~/.bitcodex/logs/<service>.log   PIDs: ~/.bitcodex/pids/<service>.pid
# Prereqs: Docker running (colima start), `yarn install`, the build order in AGENTS.md, scripts/dev-env.sh.
set -euo pipefail
FAST=0
for a in "$@"; do [[ "$a" == "--fast" ]] && FAST=1; done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$HOME/.bitcodex"
LOGS="$CFG/logs"
PIDS="$CFG/pids"
# `docker compose` plugin if registered, else the standalone docker-compose binary.
if docker compose version >/dev/null 2>&1; then DC=(docker compose); else DC=(docker-compose); fi
COMPOSE=("${DC[@]}" -f "$ROOT/scripts/local/docker-compose.local.yml")
mkdir -p "$LOGS" "$PIDS"

# Key share nodes back up their DB with pg_dump at startup (Homebrew libpq is keg-only).
[[ -d /opt/homebrew/opt/libpq/bin ]] && export PATH="/opt/homebrew/opt/libpq/bin:$PATH"
command -v pg_dump >/dev/null || { echo "missing pg_dump: brew install libpq"; exit 1; }

for f in bitcodex_api_server.env key_share_node.env key_share_node_2.env bitcodex_attached.env demo_web.env; do
  [[ -f "$CFG/$f" ]] || { echo "missing $CFG/$f: run scripts/dev-env.sh first"; exit 1; }
done

wait_http() { # name url seconds
  local name="$1" url="$2" secs="$3"
  for _ in $(seq 1 "$secs"); do
    curl -s -o /dev/null -m 2 "$url" && { echo "up     $name ($url)"; return 0; }
    sleep 1
  done
  echo "FAILED $name did not answer at $url within ${secs}s; see $LOGS/$name.log"
  exit 1
}

start() { # name dir yarn-script
  local name="$1" dir="$2" script="$3" pidf="$PIDS/$1.pid"
  if [[ -f "$pidf" ]] && kill -0 "$(cat "$pidf")" 2>/dev/null; then
    echo "running $name (pid $(cat "$pidf"))"
    return
  fi
  (cd "$ROOT/$dir" && nohup corepack yarn run "$script" > "$LOGS/$name.log" 2>&1 & echo $! > "$pidf")
  echo "start  $name (pid $(cat "$pidf"))"
}

echo "== containers"
"${COMPOSE[@]}" up -d --wait postgres
"${COMPOSE[@]}" up -d subtensor-localnet

echo "== bitcodex_api (runs its DB migrations on launch)"
start bitcodex_api backend/bitcodex_api/server dev
wait_http bitcodex_api http://localhost:4200/ 120

psql_api() { "${COMPOSE[@]}" exec -T postgres psql -U postgres -d bitcodex_dev -tAc "$1"; }
if [[ "$(psql_api 'SELECT count(*) FROM api_keys' | tr -d '[:space:]')" == "0" ]]; then
  echo "== seeding fresh API database (dev seed: KSN URLs, demo API key)"
  (cd "$ROOT/backend/bitcodex_pg_interface" && TARGET=dev corepack yarn run seed > "$LOGS/seed.log" 2>&1) \
    || { echo "FAILED seed; see $LOGS/seed.log"; exit 1; }
else
  echo "== API database already seeded; skipping (the seed deletes all rows)"
fi

echo "== key share nodes (each runs its own migrations)"
start ksn_1 key_share_node/server start
start ksn_2 key_share_node/server start_2
wait_http ksn_1 http://localhost:4201/ 120
wait_http ksn_2 http://localhost:4202/ 120

echo "== frontends"
if [[ "${FAST:-0}" == 1 ]]; then
  # --fast: production builds (no on-demand compiling). Rebuild by running dev-up again.
  echo "== building demo_web for production (a few minutes)"
  (cd "$ROOT/apps/demo_web" && corepack yarn run build_env > "$LOGS/demo_web_build.log" 2>&1) \
    || { echo "FAILED demo build; see $LOGS/demo_web_build.log"; exit 1; }
  start bitcodex_attached embed/bitcodex_attached serve_built
  start demo_web apps/demo_web start
else
  start bitcodex_attached embed/bitcodex_attached dev
  start demo_web apps/demo_web dev
fi
wait_http bitcodex_attached http://localhost:3201/ 600
wait_http demo_web http://localhost:3200/ 240

echo "== localnet"
curl -s -m 3 -H 'Content-Type: application/json' -d '{"id":1,"jsonrpc":"2.0","method":"system_chainType"}' http://127.0.0.1:9944 \
  | grep -q '"Local"' && echo "up     subtensor localnet (chainType Local)" || echo "WARN   localnet RPC not answering yet"

echo
echo "Demo:   http://localhost:3200"
echo "Iframe: http://localhost:3201"
echo "Stop:   scripts/dev-down.sh"
