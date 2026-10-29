# X06 · User dashboard (Bittensor assets, stake, apps, security)

**Tier:** PREVIEW (BUILD if time) · **Phase:** 5 · **Owner:** either

## Goal
A Privy/BitcodeX-style page where the user sees and controls their wallet outside any app.

## Research first
`apps/user_dashboard/src/**` (assets, total_balance, deposit_modal, address_qr_modal, connected_apps, key_export_prompt_modal, show_hide_chains_modal).

## How to build
1. Total balance (free + staked) in TAO and USD (CoinGecko `bittensor`, cached 60 s, offline fallback).
2. Stake table: subnet, validator hotkey, alpha, TAO value.
3. Deposit modal: address, QR, faucet button on localnet/testnet.
4. Connected apps (from BitcodeX) + active proxies (from chain, X09) with Revoke.
5. Hotkeys I own (X08).
6. Security: export key (X07), sign out everywhere.
7. Remove all non-Bittensor chains from the default view (keep code).

## Acceptance checks
- [ ] Numbers match chain queries for a user with balance, two stakes and one proxy. (Data layer passed 2026-10-29: `tests/dashboard_state.localnet.test.ts`, balance/reserved exact at one block, two stakes match the runtime API, one Staking proxy listed with its deposit. Page with a real login: pending.)
- [ ] Revoke proxy works and disappears after the block. (Chain side passed: `tests/proxy_state.localnet.test.ts`, list empty and deposit 0 after `removeProxy`. Button: pending.)
- [ ] Works with the price API blocked. (Built: last known price is shown labelled "last known price", else "USD unavailable"; TAO numbers never depend on it. Browser check pending.)

## Build notes (2026-10-29)
- Home page is Bittensor only (`components/bittensor/bittensor_home.tsx`): balance (free + stake value, TAO and USD), deposit (address, QR, faucet), stake by subnet, hotkeys owned (chain `OwnedHotkeys`), app/agent permissions (chain `proxy.proxies`) with Revoke, history, hotkey swap (Preview, localnet only), coldkey swap explainer (Preview, delays from chain), security (export, sign out). All of it refreshes on every new block.
- USD: CoinGecko `simple/price?ids=bittensor` (checked live: $246.88), cached 60 s, last good price kept in localStorage. Labelled as the mainnet reference price, because localnet TAO is test money.
- The multi-chain TotalBalance, MyAssets and Transaction History views are hidden; the code is kept. EVM/Cosmos/SVM SDK instances stay initialised because login and connected-apps code depend on them, with no UI.
- Export page shows only the Bittensor coldkey section (`SHOW_OTHER_CHAINS = false`).
- History here lists only transactions sent from the dashboard; each app's SDK keeps its own (no indexer).
