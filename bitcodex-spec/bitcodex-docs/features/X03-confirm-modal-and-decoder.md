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
- [ ] Transfer, stake, register, proxy-wrapped stake, and batch each show the right card with correct numbers.
- [ ] A transfer hidden inside `utility.batch` is shown as a transfer (not hidden).
- [ ] Fee shown matches the actual fee within rounding.
- [ ] Request from a non-allowed origin is rejected before the modal opens.
- [ ] Mainnet payload is refused with a clear message while the flag is off.
