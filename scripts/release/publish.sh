#!/usr/bin/env bash
# Publish the four packages to npm, in dependency order. Run from anywhere.
#
#   scripts/release/publish.sh                        # asks for the 6-digit code per package
#   NPM_OTP=123456 scripts/release/publish.sh        # or pass one code (non-interactive)
#   scripts/release/publish.sh --dry-run             # show what would be published
#
# Needs: `npm login` done, two-factor authentication enabled on the npm account, and the
# @bitcodex scope owned by that account. Stops at the first failure. Safe to re-run: a
# version that is already on npm is skipped.
set -euo pipefail
cd "$(dirname "$0")/../.."

DRY=""
[ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

[ -d release/packages ] || { echo "run first: node scripts/release/build_packages.mjs"; exit 1; }

# Publishing from the package folders avoids the repo's .npmrc (it holds a ${NPM_TOKEN}
# placeholder that would override your login).
who="$(cd release/packages/sdk-core && npm whoami 2>/dev/null || true)"
[ -n "$who" ] || { echo "not logged in: run 'npm login' first"; exit 1; }
echo "npm user: $who"

for pkg in sdk-core sdk-bittensor sdk-react server; do
  dir="release/packages/$pkg"
  name="$(node -p "require('./$dir/package.json').name")"
  ver="$(node -p "require('./$dir/package.json').version")"
  if npm view "$name@$ver" version >/dev/null 2>&1; then
    echo "skip $name@$ver (already on npm)"
    continue
  fi
  otp="${NPM_OTP:-}"
  # In an interactive Terminal, ask for a fresh code for each package (they expire in ~30 s).
  if [ -z "$otp" ] && [ -z "$DRY" ] && [ -t 0 ]; then
    read -r -p "6-digit code from your authenticator for $name: " otp
  fi
  echo "publishing $name@$ver $DRY"
  (cd "$dir" && npm publish --access public $DRY ${otp:+--otp "$otp"})
done
echo "done."
