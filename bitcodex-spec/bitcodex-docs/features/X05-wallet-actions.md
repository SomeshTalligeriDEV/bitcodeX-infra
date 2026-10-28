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
- [ ] Send 10 TAO between two BitcodeX users; both balances correct; fee as previewed.
- [ ] Stake 50 TAO to a localnet validator on a subnet; stake shows in `getStakes()`; unstake half; numbers match chain.
- [ ] Limit stake with a too-tight price fails with a clear, decoded error.
- [ ] `signMessage` signature verifies with `signatureVerify` against the SS58 address.
- [ ] History lists all of the above with status and block.
