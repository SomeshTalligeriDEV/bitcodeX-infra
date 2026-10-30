# X03 · Signing confirmation modal and Bittensor call decoder

**Tier:** BUILD · **Phase:** 2 · **Owner:** Builder 1

## Goal
Every signature request shows a clear, Privy-quality modal: what the call does in plain English, amounts in TAO, destination, network, fee, and the requesting app's origin.

## Research first
- `embed/bitcodex_attached/src/components/modal_variants/svm/**`, `tx-parsers/svm/**`, `web3/svm/use_calculate_fee.ts`.
- polkadot.js: `api.registry.createType('ExtrinsicPayload', ...)`, `api.createType('Call', method)`, `call.section`, `call.method`, `call.args`, `tx.paymentInfo`.
- Read metadata on localnet for exact names: `balances`, `subtensorModule`, `proxy`, `utility`, `system`.

## Mirror these files
`modal_variants/svm/` → `modal_variants/bittensor/`; `tx-parsers/svm/` → `tx-parsers/bittensor/`; `web3/svm/` → `web3/bittensor/`.

## How to build
1. Parser: payload → `{ section, method, args, era, nonce, tip, specVersion, genesisHash }`; detect network from genesis hash; refuse if mainnet disabled.
2. Friendly cards: Transfer, Stake (add/remove/move/swap, limit variants), Register (burnedRegister), Register network, Proxy (add/remove/proxy call with inner call decoded), Utility batch (list inner calls), System remark, Swap hotkey/coldkey. Everything else: "Unknown call" red card with raw section.method and args JSON.
3. Amounts: rao → TAO with 9 decimals, trimmed; show USD if price is known.
4. Fee: `paymentInfo` from the iframe's own API connection, not from the app.
5. Raw message signing modal: show message text (or hex), and for Sign-in-with-Bittensor show domain, address, nonce, issued-at.

## Acceptance checks
- [x] Transfer, stake, register, proxy-wrapped stake, and batch each show the right card with correct numbers. (2026-10-28: `tests/describe.localnet.test.ts`, cards decoded from call hex built with live localnet metadata.)
- [x] A transfer hidden inside `utility.batch` is shown as a transfer (not hidden). (Same test: batch(remark, transfer 3 TAO) → inner "Send TAO", 3 TAO.)
- [x] Fee shown matches the actual fee within rounding. (2026-10-28 localnet: `paymentInfo` 83124 rao = `TransactionFeePaid` 83124 rao.)
- [ ] Request from a non-allowed origin is rejected before the modal opens. (Built: `VITE_BITTENSOR_ALLOWED_HOST_ORIGINS` check in `window_msgs/open_modal.ts` answers `origin_not_allowed`; browser check pending. Per-app origins from the developer dashboard come with X11.)
- [ ] Mainnet payload is refused with a clear message while the flag is off. (Built: the iframe connects only through `getApi`, which refuses mainnet, and rejects a payload whose genesis differs from its connection; unit-tested in `@bitcodex/bittensor-chain`; browser check pending.)

## Not built yet
- USD values: no price source yet; amounts are shown in TAO/alpha only (no made-up prices).
- Sign-in-with-Bittensor fields in the raw message modal: comes with X05 `signInWithBittensor` once its message format is verified.
