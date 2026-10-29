# X05 · Wallet actions: send, stake (swap), sign message, history

**Tier:** BUILD · **Phase:** 3 · **Owner:** Builder 1 · **Depends on:** X02, X03

## Goal
The wallet does what users expect from Privy + MetaMask, in Bittensor terms: send TAO, stake and unstake (the native TAO ↔ alpha swap), sign messages, see history.

## Research first
- Docs: `concepts/money`, `concepts/staking-pools`, `guides/staking`, query pages `alpha-price`, `quote-stake`, `quote-unstake`.
- Metadata on localnet: exact names and args for `transferKeepAlive`, `addStake`, `removeStake`, `addStakeLimit`, `removeStakeLimit`, `moveStake`, `swapStake`, `unstakeAll`; runtime APIs for stake info and quotes (check `api.call.*` list).
- Whether stake calls need MEV shield from JS (docs mention two-popup MEV flow for btcli).

## How to build
1. SDK helpers: `sendTao(to, amountTao)`, `stake({ netuid, hotkey, amountTao, limitPrice? })`, `unstake(...)`, `signMessage(text)`, `signInWithBittensor({ domain, nonce })`, `getBalances()`, `getStakes()`, `getHistory()`.
2. Quotes before staking: expected alpha, price impact, fee; use limit variants with a user slippage setting (default 1%).
3. History: store tx hash, type, amounts, block, status per user in the iframe (IndexedDB) and read events from chain for confirmation. (A full indexer is out of scope.)
4. Verify a SIWB signature server-side with `@polkadot/util-crypto` `signatureVerify` (used by X04 and X10).

## Acceptance checks
- [ ] Send 10 TAO between two BitcodeX users; both balances correct; fee as previewed. (Chain side passed 2026-10-29: `tests/wallet_data.localnet.test.ts`, sender −(10 TAO + fee), receiver +10 TAO exactly, charged fee = `paymentInfo` preview. With two BitcodeX logins still pending: needs Google sign-in.)
- [ ] Stake 50 TAO to a localnet validator on a subnet; stake shows in `getStakes()`; unstake half; numbers match chain. (Chain side passed: `addStakeLimit` at the quoted limit; `getStakes` = `StakeAdded` alpha (±1 rao share rounding); half unstaked; remainder matches. From the demo UI: pending Google sign-in.)
- [x] Limit stake with a too-tight price fails with a clear, decoded error. (`subtensorModule.SlippageTooHigh` / `swap.PriceLimitExceeded`, decoded by name; recorded as a failed history entry by the SDK.)
- [ ] `signMessage` signature verifies with `signatureVerify` against the SS58 address. (Built in X02; demo "Sign message" runs `signatureVerify`. Pending Google sign-in.)
- [ ] History lists all of the above with status and block. (Built: the SDK records every included extrinsic, success or failed with decoded error, plus block number and the plain-English card. Pending the UI run.)

## Build notes (2026-10-29)
- `@bitcodex/bittensor-chain`: `parseUnits`, `getBalances` (transferable = free − freeze not covered by reserves), `getStakes` (valued with `simSwapAlphaForTao`), `quoteStake` / `quoteUnstake`, `listSubnets`, `formatPrice`.
- Limit price: the chain checks it against the price AFTER the swap. End price = average² / spot (constant product); limit = end price × (1 ± slippage). Default slippage 1%.
- `@bitcodex/sdk-bittensor`: `sendTao`, `stake`, `unstake` (limit variants, `allowPartial` false), `quoteStake`, `quoteUnstake`, `getBalances`, `getStakes`, `listSubnets`, `getHistory`, event `historyChanged`.
- History lives in the SDK on the app's origin (localStorage, memory fallback), not in the iframe: the iframe signs but never sees the tx hash or inclusion. It lists only transactions sent from this browser; a full indexer is out of scope.
- Quotes are estimates: subnet emissions move the pool every block, so the fill can differ slightly from the quote (0.13% on a fresh localnet subnet); the limit price caps it.
- Not built: `signInWithBittensor`, until its message format is verified (no invented format).
- Localnet seeding: `node sdk/bitcodex_bittensor_chain/scripts/seed_localnet.mjs` creates or reuses the subnet owned by `//BitcodeXValidator`.
