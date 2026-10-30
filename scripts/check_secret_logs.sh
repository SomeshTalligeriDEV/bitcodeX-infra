#!/usr/bin/env bash
# Flags log statements that mention secret-bearing names (CLAUDE.md: never log a key
# share, seed, mnemonic, signature nonce, JWT or OAuth token). Prints matches and exits
# 1 if any are not on the reviewed allowlist (scripts/check_secret_logs.allow).
set -uo pipefail
cd "$(dirname "$0")/.."
PATTERN='(console\.(log|info|debug|warn|error)|logger\.(info|debug|warn|error)|log\.(info|debug|warn|error))\(.*\b(idToken|id_token|jwt|jwtToken|access_token|accessToken|token|secret|password|mnemonic|seed|keyshare|key_share|share|nonce|privateKey|private_key|signingShare)\b'
ALLOW=scripts/check_secret_logs.allow
hits=$(grep -rnE "$PATTERN" \
  --include='*.ts' --include='*.tsx' \
  backend key_share_node embed/bitcodex_attached/src sdk apps/demo_web/src apps/user_dashboard/src \
  2>/dev/null | grep -v node_modules | grep -v '/dist/' | grep -vE '\.test\.tsx?:|/tests?/' || true)
[[ -z "$hits" ]] && { echo "no secret-bearing log statements"; exit 0; }
new=$(echo "$hits" | while IFS= read -r line; do
  key=$(echo "$line" | cut -d: -f1,3- | sed 's/^[[:space:]]*//')
  grep -qxF "$key" "$ALLOW" 2>/dev/null || echo "$line"
done)
if [[ -n "$new" ]]; then
  echo "Review these log statements (add to $ALLOW only if they never print the secret value):"
  echo "$new"
  exit 1
fi
echo "only reviewed log statements found"
