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

## X08 · Hotkeys and registration (demo, Hotkeys panel)
- [ ] Create a hotkey with btcli on a machine (or a test sr25519 address), "Add" it with a label: shows "not owned yet · not registered".
- [ ] Register it on the seeded subnet: the popup shows the "Register a hotkey" card and a live "Registration cost, if included in the next block". After inclusion the log shows "charged X (shown max Y)" with X = the popup cost if it landed in the next block, never more.
- [ ] The hotkey then shows "owned by this wallet · subnet N UID U".
- [ ] Registering the same hotkey again is refused before signing ("already registered").
- [ ] History shows "Register a hotkey on a subnet".

## X07 · Export and recovery (user dashboard `http://localhost:3206`, Export)
- [ ] Export → re-auth with Google → the Bittensor seed appears blurred; "Address this key opens" equals the wallet address.
- [ ] Download keystore JSON with a password; import it with polkadot.js (`addFromJson` + password, or an extension's restore-from-JSON) → same address → sign a localnet transfer.
- [ ] Network tab during export: no seed, no seed share in any request or response, except the server seed share in the `export_shares` response, which is by design.
- [ ] Clear site data for localhost:3201 → log in again → same address (recovery from key share nodes).
- [ ] Hotkey swap screen (Preview label): swap a registered hotkey on one subnet, cost 0.001 TAO shown = charged; the UID moves to the new hotkey.

## X06 · User dashboard (`http://localhost:3206`)
- [ ] Sign in with Google: the home page shows only Bittensor; no Solana/Cosmos/EVM anywhere (home, left bar, export).
- [ ] Balance = free + stake value; compare with `node` raw queries for the same address (free, `getStakeInfoForColdkey`). USD shown with "Reference only".
- [ ] Block `api.coingecko.com` in DevTools (Network → Block request domain), reload: TAO numbers still shown; USD shows "last known price" or "USD unavailable".
- [ ] Get test TAO, stake on two hotkeys from the demo, grant one proxy (X09): all three appear here within a block.
- [ ] Revoke the proxy: the popup shows "Remove a permission"; after the block the row disappears and the deposit is returned.
- [ ] Hotkey swap (Preview): swap one subnet, cost 0.001 TAO; UID moves.
- [ ] Coldkey swap (Preview): explainer shows this network's delay (50 blocks on localnet); there is no execute button.
- [ ] Export key → Bittensor section only (see X07 checks). Sign out works.

## X09 · App and agent permissions (demo, "Agent permissions" panel; restart demo so DEMO_AGENT_SURI is loaded)
- [ ] Grant Staking: the popup shows "Permission: Staking", what the app can do (stake, unstake, move, swap…), what it cannot, and the deposit (0.06 + 0.033 TAO read from chain).
- [ ] "Ask agent to stake 1 TAO": no popup; the stake appears under "Your stake" and in the dashboard.
- [ ] Grant SmallTransfer: the popup says "send TAO, only below 0.5 TAO per call".
- [ ] Daily limit 1.5 (Preview): the second 1 TAO request is refused with the Preview message.
- [ ] Revoke in the demo or dashboard: the next "Ask agent" gives "no Staking permission".

## Testnet (set NEXT_PUBLIC_BITTENSOR_CHAIN_ID=bittensor:testnet in demo_web.env and user_dashboard.env, restart)
- [ ] Demo and dashboard badges say "Testnet"; no "Get test TAO" button; the testnet funding note is shown.
- [ ] Sign in: same coldkey address as on localnet (the key does not depend on the network).
- [ ] With testnet TAO sent to the address: Send 0.1 TAO, popup shows Network "Testnet", tx included on testnet.
