# 05 · Rebrand BitcodeX → BitcodeX

About 1,200 of BitcodeX's ~3,000 tracked files have "bitcodex" in their path, and package names are `@bitcodex/*`. Renaming everything at once will break the build for days. So the rebrand has two stages.

## Licence first (Apache-2.0)

- Keep `LICENSE` unchanged.
- Add `NOTICE` at the root:
  ```
  BitcodeX Infrastructure

  Third-party components retain their own copyright notices and licenses.
  ```
- Keep existing copyright headers in files. Add "Modified by BitcodeX" to files we change substantially.
- Apache-2.0 gives no trademark rights: remove third-party product names and logos from every user-facing surface.

## Stage A · Visible rebrand (do first, day 1)

Goal: a user and a judge never see "BitcodeX". Code identifiers stay.

1. **Names and copy:** every user-visible string "BitcodeX", "BitcodeX Wallet", "bitcodex.app" → "BitcodeX", "BitcodeX Wallet", our domain. Search: `rg -i "bitcodex" --glob '*.{tsx,ts,scss,html,md,json}' apps embed ui sdk/*/README.md` and review hits by hand (do not blind-replace in code identifiers).
2. **Logos and images:** replace files under `public/`, `assets/`, favicons, social images, the README image, email templates (`apps/email_template_2`). Use a simple BitcodeX wordmark (SVG we make).
3. **Theme:** brand colour tokens in `ui/bitcodex_common_ui` theme files.
4. **Domains and URLs:** iframe origin, docs link, demo link, dashboard links → env vars (`NEXT_PUBLIC_BITCODEX_*`, `VITE_BITCODEX_*`), defaulting to localhost ports.
5. **Hard-coded credentials:** replace `GOOGLE_CLIENT_ID`, `X_CLIENT_ID`, `DISCORD_CLIENT_ID`, `GITHUB_CLIENT_ID` and the Telegram bot config in `embed/bitcodex_attached/src/config/*`, `backend/bitcodex_api/server/src/middleware/auth/google_auth/client_id.ts`, `key_share_node/server/src/auth/google/client_id.ts` with env-driven values. Create our own free OAuth apps (Google Cloud console in "Testing" mode, GitHub OAuth app).
6. **Analytics:** disable Amplitude (`embed/bitcodex_attached/src/analytics`) unless a key is set; default off.
7. **Remove** `service_shutdown_modal` and any link to BitcodeX's hosted service.
8. **Root docs:** new README (what BitcodeX is, credit to BitcodeX), keep `AGENTS.md` but add a BitcodeX section at the top.

Acceptance: `rg -i "bitcodex" apps embed ui --glob '*.tsx'` shows no user-visible string; all apps build; Solana devnet signing still works in demo_web (proves nothing broke).

## Stage B · Code rename (only after Phase 2 works, optional for the hackathon)

Do it with a script in one commit, never by hand:

1. Package scope `@bitcodex/*` → `@bitcodex/*` (package.json names, imports, tsconfig paths, lerna/syncpack config).
2. Folder names `bitcodex_*` → `bitcodex_*` (git mv), workspace list in root `package.json`.
3. Identifiers `BitcodeX*`/`bitcodex*` in TS → `Bitcodex*`/`bitcodex*` (exclude `crypto/` Rust crate names unless needed).
4. Env var prefixes `BITCODEX_` → `BITCODEX_`.
5. `yarn install`, `yarn ci setup`, full e2e. Revert if anything fails.

If the hackathon is close, skip Stage B: users and judges only see Stage A.
