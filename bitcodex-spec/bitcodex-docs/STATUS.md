# BitcodeX status (honest, 2026-10-29)

Rule: nothing simulated ships. **Real** = works against the live chain/API (tested chain-side or over HTTP). **Preview** = real data or real action, labelled. **Not built** = hidden or "Coming soon".
Every Real item below still needs one browser run with a real Google login (`PENDING_BROWSER_CHECKS.md`); none has been clicked through yet.

| Area | Status | Proof so far |
|---|---|---|
| FROST 2-of-2 coldkey, signing accepted by Subtensor | Real | phase-0 probes, tx hashes in 00-research.md |
| Signing popup with plain-English cards, fee, warnings | Real | localnet tests, fee preview = charged |
| SDK: send, stake/unstake + quotes, balances, history | Real | 62 localnet tests |
| Sign-In with Bittensor (CAIP-122 profile) | Real | FROST signature verified |
| Hotkeys + registration (exact cost) | Real | charge = prediction to the rao |
| Export key (seed + keystore JSON) | Real | imported key signed a localnet tx |
| Hotkey swap | Preview (localnet only) | exact cost on chain |
| Coldkey swap | Preview (explainer only, no action) | delays read from chain |
| User dashboard (Bittensor only) | Real | data layer = raw chain storage |
| App/agent permissions (proxies) | Real | 4 acceptance tests on chain |
| Agent daily limit | Preview (enforced by agent server, not chain) | curl test |
| Developer dashboard: apps, key, secret once, origins, login methods, theme, network | Real | HTTP end-to-end test |
| Developer dashboard users table | Preview (per account, not per app) | HTTP test |
| Faucet | Real (localnet only; hidden on testnet) | 1000 TAO in 1 block |
| Testnet | Real (read + signature validity), funded transfer not yet done | official endpoint + genesis allowlist; 600 subnets read; FROST signature accepted by testnet's signature check without spending; apps pick the network with `NEXT_PUBLIC_BITTENSOR_CHAIN_ID`. No testnet faucet exists in the official docs, so the apps show a note instead of a link. A real testnet transfer needs testnet TAO. |
| Wallet login (Talisman / SubWallet / Polkadot.js via Sign-In with Bittensor) + linked accounts (X04) | Real (API + SDK); built-in modal button Not built | HTTP end-to-end test on testnet genesis: login, token verify, replay/foreign-domain/bad-signature rejected, link to user, linked user sign-in. SDK `listExtensionAccounts` / `loginWithWallet` / `linkWallet` need a browser with an extension. Wallet-only users get no embedded key (by design: key share nodes only accept OAuth identities). |
| Email login, passkey login (X04) | Not built | email needs a mail server; passkey = stretch |
| Server SDK (X10), MFA (X12), EVM address (X13) | Not built | |
| npm packages `@bitcodex/sdk-core`, `sdk-bittensor`, `sdk-react`, `server` 0.1.0 | Real, packed, not published | `node scripts/release/build_packages.mjs` → `release/tarballs/`. Installed into a brand-new folder: imports work in Node, `@bitcodex/server` read live chain data, a sample React app typechecks. Licence is `UNLICENSED` until the owner picks one (no LICENSE file in the repo). With `skipLibCheck: false`, core types need optional peers viem / @keplr-wallet/types / @cosmjs/amino. |
| `@bitcodex/server`: access tokens (EdDSA JWT + JWKS), getUser, getWallets | Real | HTTP end-to-end test: issue, verify, tamper/wrong-audience/wrong-secret/unknown-user rejected. Users are scoped per developer account, not per app. SDK `getAccessToken()` needs the browser check. |
| Self-host compose, Playwright quickstart, demo instance | Not built | |
| Tensor Studio integration (X16) | Deferred | Studio not built |
| Mainnet | Disabled by design | needs DKG + audit |
