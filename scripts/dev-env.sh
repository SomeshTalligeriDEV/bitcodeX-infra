#!/usr/bin/env bash
# Create local env files in ~/.bitcodex from the checked-in *.env.example files.
# Secrets are generated here (openssl rand) and never printed. Existing files are kept
# unless --force is given.
#
# Optional OAuth client IDs (public values) are read from the environment:
#   GOOGLE_CLIENT_ID=... GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... scripts/dev-env.sh --force
# --force rewrites the env files (keeping the existing secrets).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$HOME/.bitcodex"
FORCE="${1:-}"

mkdir -p "$CFG"
chmod 700 "$CFG"

rand() { openssl rand -hex 32; }

# Shared between the API and the key share nodes; must match. Created once and never
# regenerated (also not by --force): the API and KSNs encrypt stored shares with them.
# To start over, run scripts/dev-down.sh --volumes and delete ~/.bitcodex.
SECRETS="$CFG/.dev_secrets"
if [[ ! -f "$SECRETS" ]]; then
  umask 077
  {
    echo "JWT_SECRET=$(rand)"
    echo "API_ENCRYPTION_SECRET=$(rand)"
    echo "KS_NODE_REPORT_PASSWORD=$(rand)"
    echo "KSN_ADMIN_PASSWORD=$(rand)"
  } > "$SECRETS"
  rand > "$CFG/encryption_secret.txt"
  chmod 600 "$CFG/encryption_secret.txt"
fi
# shellcheck disable=SC1090
source "$SECRETS"

# set_kv FILE KEY VALUE: replace `KEY=...` (or append) without echoing the value.
set_kv() {
  local file="$1" key="$2" val="$3"
  if grep -qE "^${key}=" "$file"; then
    KEY="$key" VAL="$val" python3 - "$file" <<'EOF'
import os, re, sys
p = sys.argv[1]; k = os.environ["KEY"]; v = os.environ["VAL"]
s = open(p).read()
s = re.sub(rf"^{re.escape(k)}=.*$", lambda _: f"{k}={v}", s, count=1, flags=re.M)
open(p, "w").write(s)
EOF
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

# make_env EXAMPLE TARGET: copy example to ~/.bitcodex/TARGET unless it exists.
make_env() {
  local example="$1" target="$CFG/$2"
  if [[ -f "$target" && "$FORCE" != "--force" ]]; then
    echo "keep   $target"
    return 1
  fi
  cp "$example" "$target"
  chmod 600 "$target"
  echo "create $target"
}

G="${GOOGLE_CLIENT_ID:-}"
GH="${GITHUB_CLIENT_ID:-}"
GHS="${GITHUB_CLIENT_SECRET:-}"

# bitcodex_api
if make_env "$ROOT/backend/bitcodex_api/server/bitcodex_api_server.env.example" bitcodex_api_server.env; then
  f="$CFG/bitcodex_api_server.env"
  set_kv "$f" JWT_SECRET "$JWT_SECRET"
  set_kv "$f" ENCRYPTION_SECRET "$API_ENCRYPTION_SECRET"
  set_kv "$f" KS_NODE_REPORT_PASSWORD "$KS_NODE_REPORT_PASSWORD"
  set_kv "$f" SLACK_WEBHOOK_URL ""
  set_kv "$f" BITCODEX_SIGNUP_ENABLED "true"
  set_kv "$f" GOOGLE_CLIENT_ID "$G"
  set_kv "$f" GITHUB_CLIENT_ID "$GH"
  set_kv "$f" GITHUB_CLIENT_SECRET "$GHS"
fi

# key share nodes 1 and 2
for n in 1 2; do
  sfx=""; [[ "$n" == 2 ]] && sfx="_2"
  if make_env "$ROOT/key_share_node/server/key_share_node${sfx}.env.example" "key_share_node${sfx}.env"; then
    f="$CFG/key_share_node${sfx}.env"
    set_kv "$f" ADMIN_PASSWORD "$KSN_ADMIN_PASSWORD"
    set_kv "$f" KS_NODE_REPORT_PASSWORD "$KS_NODE_REPORT_PASSWORD"
    set_kv "$f" ENCRYPTION_SECRET_PATH "~/.bitcodex/encryption_secret.txt"
    set_kv "$f" GOOGLE_CLIENT_ID "$G"
    set_kv "$f" GITHUB_CLIENT_ID "$GH"
  fi
done

# iframe (bitcodex_attached) and demo_web
if make_env "$ROOT/embed/bitcodex_attached/bitcodex_attached.env.example" bitcodex_attached.env; then
  set_kv "$CFG/bitcodex_attached.env" VITE_GOOGLE_CLIENT_ID "$G"
  set_kv "$CFG/bitcodex_attached.env" VITE_GITHUB_CLIENT_ID "$GH"
fi
make_env "$ROOT/apps/demo_web/demo_web.env.example" demo_web.env || true

# Non-secret keys added after the first run: append to existing files, never overwrite.
ensure_kv() {
  local file="$1" key="$2" val="$3"
  [[ -f "$file" ]] && ! grep -qE "^${key}=" "$file" && printf '%s=%s\n' "$key" "$val" >> "$file"
  return 0
}
ensure_kv "$CFG/bitcodex_api_server.env" BITCODEX_FAUCET_SURI "//Alice"
ensure_kv "$CFG/bitcodex_api_server.env" BITCODEX_FAUCET_RPC_URL "ws://127.0.0.1:9944"
ensure_kv "$CFG/bitcodex_api_server.env" BITCODEX_FAUCET_AMOUNT_TAO "1000"
ensure_kv "$CFG/demo_web.env" NEXT_PUBLIC_BITCODEX_API_ENDPOINT "http://localhost:4200"
ensure_kv "$CFG/demo_web.env" DEMO_AGENT_SURI "//BitcodeXDemoAgent"
ensure_kv "$CFG/demo_web.env" DEMO_AGENT_RPC_URL "ws://127.0.0.1:9944"
ensure_kv "$CFG/bitcodex_attached.env" VITE_BITTENSOR_ALLOWED_HOST_ORIGINS "http://localhost:3200,http://localhost:3210"

[[ -z "$G" ]] && echo "note: GOOGLE_CLIENT_ID not set; re-run with it (and --force) once the OAuth client exists."
echo "done. Env files are in $CFG (secrets not printed)."
