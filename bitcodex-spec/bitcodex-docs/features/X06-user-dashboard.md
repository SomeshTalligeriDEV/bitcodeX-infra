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
- [ ] Numbers match chain queries for a user with balance, two stakes and one proxy.
- [ ] Revoke proxy works and disappears after the block.
- [ ] Works with the price API blocked.
