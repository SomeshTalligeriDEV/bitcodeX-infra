# Pending browser checks (need the user's Google login)

Run all of these in one session once the Google/GitHub OAuth IDs are saved
(`scripts/dev-env.sh --force` with the IDs, then `scripts/dev-down.sh && scripts/dev-up.sh`).
Chrome first (DevTools → Network, "Preserve log"), then Safari for the cross-browser checks.
Before starting: `node sdk/bitcodex_bittensor_chain/scripts/seed_localnet.mjs` (test subnet + validator).

Record each result here with the tx hash, then tick it.

## X02 · Wallet creation and SDK (demo `http://localhost:3200`, Bittensor wallet card)
- [ ] Google sign-in creates a new address starting with `5`.
- [ ] Sign out, sign in again: same address.
- [ ] Safari, same Google account: same address.
- [ ] Get test TAO (X14), then Send TAO to another address: tx hash, balance drops by amount + fee.
- [ ] Sign long payload (>256 bytes, `utility.batchAll` of 10 remarks): tx hash.
- [ ] Sign message: `verified=true`.
- [ ] web3Enable test: BitcodeX listed, account found, remark tx hash.
- [ ] Network tab (HAR saved to `~/Downloads/bitcodex-chrome.har`): no key share, seed or signing nonce in any request or response.
- [ ] `examples/bittensor_nextjs` (`http://localhost:3210`): sign in, address shown, send TAO works.

## X03 · Signing popup
- [ ] Transfer, stake, register, proxy-wrapped stake, batch: each popup shows the right card and numbers.
- [ ] A transfer inside a batch is shown as "Send TAO" in the popup.
- [ ] Fee in the popup = fee charged (compare with the tx's `TransactionFeePaid`).
- [ ] Request from a site not in `VITE_BITTENSOR_ALLOWED_HOST_ORIGINS` is refused before the popup opens (`origin_not_allowed`).
- [ ] Mainnet payload refused with a clear message.

## X05 · Wallet actions
- [ ] Two BitcodeX users (Google in Chrome + a second account): send 10 TAO, both balances correct, fee as previewed.
- [ ] Stake 50 TAO on the seeded subnet from the Stake panel; it appears under "Your stake"; unstake half; numbers match chain.
- [ ] Slippage 0%: stake fails with a decoded error and appears in History as failed.
- [ ] History lists every action above with status, block and tx hash.

## X14 · Faucet
- [ ] New user → "Get 1000 test TAO" → balance shows 1,000 TAO within 2 blocks.
- [ ] "Receive (QR)" shows a QR that scans to the address.

## Sign-In with Bittensor
- [ ] Demo "Sign in with Bittensor": the popup shows Site `localhost:3200`, URI, Chain `polkadot:<genesis prefix>`, nonce, issued and expiry times, and "cannot move funds"; result `verified=true crypto=ed25519`.
- [ ] A SIWB message whose domain is another site (sent from the demo with `domain: "evil.example"`, e.g. via the browser console) shows the red "Do not sign" warning and Approve stays disabled.
