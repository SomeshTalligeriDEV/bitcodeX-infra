# 08 · Demo app and demo script

## The demo app (like demo.privy.io)

Layout, like BitcodeX's `demo_web` and Privy's demo: left bar (integration cards and docs links), centre panel of widgets, right panel with live preview and console (every SDK call and result printed).

Widgets:
1. **Login:** "Continue with Google", email, GitHub, X, Discord, Telegram, passkey, "Connect Talisman/SubWallet/Polkadot.js". Theme switch (light/dark) and accent colour, applied live to the modal.
2. **User:** user id, linked accounts, auth type, email, created time.
3. **Wallet:** address (copy, QR), network badge (Localnet/Testnet; Mainnet disabled), TAO balance + USD, "Get test TAO".
4. **Send TAO:** to, amount, fee preview, confirm modal, result with tx hash.
5. **Stake:** pick subnet and validator hotkey, amount, quote (alpha out, fee), stake/unstake.
6. **Register hotkey:** paste hotkey address, netuid, burn cost, register.
7. **Sign message:** Sign-in-with-Bittensor message and raw message; show signature and verify it.
8. **App permissions (Phase 5):** grant a demo agent a Staking proxy; agent stakes 1 TAO; revoke.
9. **Export key:** re-auth, reveal seed (blurred until tap), warning text.
10. **Code panel:** the 10 lines of SDK code for each widget.

## 3-minute script

1. (20 s) "Bittensor has no Privy. Every user needs an extension and a seed phrase." Show the wallet list on bittensor.com/wallet.
2. (30 s) Click "Continue with Google". A Bittensor address appears. "No seed phrase. The key was never in one place: half in this browser, half on our server, backup split across key share nodes."
3. (20 s) Get test TAO. Balance updates.
4. (30 s) Send 10 TAO: the confirm modal shows "Transfer 10 TAO to 5F…, fee 0.000… TAO". Approve. Tx hash.
5. (30 s) Stake 50 TAO to a validator on subnet 1; register a miner hotkey.
6. (20 s) Open Bitcode Studio: "Sign in with BitcodeX" → launch a subnet signed with the same wallet.
7. (20 s) Code panel: "Any Bittensor app adds this in 10 lines." Credit: built on BitcodeX (Apache-2.0).
8. (10 s) Roadmap: proxies for AI agents, MFA, EVM, distributed keygen (FROST DKG), audit, then mainnet.

## Steps added by the agent

(Each feature adds its exact clicks here once its checks pass.)
