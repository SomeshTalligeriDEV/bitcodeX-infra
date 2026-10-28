#!/usr/bin/env bash
# Stop the local BitcodeX stack started by scripts/dev-up.sh.
#   --volumes  also delete the Postgres volume (fresh DBs next time; key shares are lost)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIDS="$HOME/.bitcodex/pids"

for pidf in "$PIDS"/*.pid; do
  [[ -e "$pidf" ]] || continue
  name="$(basename "$pidf" .pid)"
  pid="$(cat "$pidf")"
  if kill -0 "$pid" 2>/dev/null; then
    # yarn spawns children; stop the whole process group.
    pkill -TERM -P "$pid" 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null || true
    echo "stop   $name (pid $pid)"
  fi
  rm -f "$pidf"
done

if docker compose version >/dev/null 2>&1; then DC=(docker compose); else DC=(docker-compose); fi
if [[ "${1:-}" == "--volumes" ]]; then
  "${DC[@]}" -f "$ROOT/scripts/local/docker-compose.local.yml" down --volumes
else
  "${DC[@]}" -f "$ROOT/scripts/local/docker-compose.local.yml" down
fi
