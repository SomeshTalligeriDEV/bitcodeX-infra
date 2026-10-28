# X02 · Bittensor ecosystem: wallet creation and SDK

**Tier:** BUILD · **Phase:** 2 · **Owner:** Builder 1 · **Depends on:** probe 3b passed, X01

## Goal
On first login a Bittensor coldkey is created (BitcodeX's Ed25519 FROST key) and shown as an SS58 address. Apps use `@bitcodex/sdk-bittensor` to connect and sign, exactly like Privy's embedded wallet.

## Research first
- `bitcodex-docs/02-bittensor-wallets.md` §2–3. BitcodeX `concepts/threshold-eddsa.md`.
- `sdk/bitcodex_sdk_svm/src/**` (full read), `sdk/bitcodex_sdk_core/src/methods/get_public_key_ed25519.ts`, `window_msgs/get_public_key_ed25519.ts`.
- polkadot.js `Signer` interface (`@polkadot/types/types/extrinsic` `Signer`, `SignerPayloadJSON`, `SignerPayloadRaw`, `SignerResult`) and `@polkadot/extension-inject` `injectExtension`.

## Mirror these files
`sdk/bitcodex_sdk_svm/` → `sdk/bitcodex_sdk_bittensor/`; SVM msg types in `sdk/bitcodex_sdk_core/src/types/` → Bittensor types; `useBitcodeXSvm` → `useBitcodexBittensor`.

## How to build
1. Package `packages/bitcodex_chain` (TS): chain configs (`bittensor:localnet|testnet|mainnet`), `getApi(chainId)` (cached `ApiPromise`), `toAddress(pubkey)` = `encodeAddress(pubkey, 42)`, `payloadBytes(payloadJson)` (SCALE + blake2_256 when > 256 bytes), `wrapEd25519(sig)` (0x00 prefix).
2. Iframe: new msg types `bittensor_get_address`, `bittensor_sign_payload`, `bittensor_sign_raw`. Address from `get_public_key_ed25519`. Signing calls BitcodeX's existing ed25519 sign path with `payloadBytes(...)`, then wraps.
3. SDK `BitcodexBittensor.init({ api_key, chain_id })` returning `{ connect, disconnect, getAddress, signer, signAndSend(tx), signMessage(msg), on/off }`. `signer` implements polkadot.js `Signer` (`signPayload`, `signRaw`).
4. `injectWeb3()`: registers BitcodeX in `window.injectedWeb3['bitcodex']` so apps using `@polkadot/extension-dapp` `web3Enable()` see it like Talisman.
5. React: `useBitcodexBittensor()` hook, `<BitcodexProvider>`.
6. Example `examples/bittensor_nextjs`: login → address → transfer.

## Acceptance checks
- [ ] New Google user → Bittensor address starting with `5` shown; same address after logout/login and on another browser.
- [ ] `api.tx.balances.transferKeepAlive(...).signAndSend(address, { signer })` succeeds on localnet; explorer/`api.query.system.account` shows new balances.
- [ ] A payload > 256 bytes (e.g. `utility.batch` of 10 remarks) signs and is accepted.
- [ ] `web3Enable('test')` in a plain polkadot.js page lists the BitcodeX account and can sign.
- [ ] Unit tests: `payloadBytes`, `wrapEd25519`, address derivation vs `@polkadot/keyring` ed25519 pair for the same public key.
- [ ] No share/seed in any network request body except BitcodeX's existing encrypted flows (check devtools).
