# X07 · Export, recovery, and key swap screens

**Tier:** BUILD (export, recovery), PREVIEW (coldkey/hotkey swap) · **Phase:** 4

## Goal
Users can always leave with their key (Privy "export wallet"), recover on a new device, and see how to rotate keys.

## Research first
- BitcodeX: `window_msgs/export_private_key.ts`, `export_key_store.ts`, `export_reauth_state.ts`, `components/export/**`, backend `/tss/v2/export_shares`, `user_reshare`.
- What BitcodeX exports for Ed25519 (seed vs scalar). polkadot.js: can `Keyring({ type: 'ed25519' }).addFromSeed(seed)` import it? Can Talisman/Polkadot.js extension import an ed25519 raw seed or JSON? Verify; if not, export as polkadot.js keystore JSON (`pair.toJson(password)`) which extensions can import.
- Docs `concepts/wallets` (coldkey swap, hotkey swap).

## How to build
1. Export: re-auth → combine inside the iframe → show seed hex blurred, copy button, and a "Download keystore JSON (password)" option. Big warning text. Never send over the network.
2. Prove portability: imported key in polkadot.js gives the same SS58 address.
3. Recovery: new browser → login → shares from KSNs → same address (BitcodeX flow; just test it).
4. Swap screens (PREVIEW): hotkey swap form (`swap_hotkey`, cost shown), coldkey swap explainer with the 5-day announce flow; execute only on localnet.

## Acceptance checks
- [ ] Export → import into polkadot.js keyring or extension → same address → can sign a transfer.
- [ ] Network tab shows no seed during export.
- [ ] Clear browser storage → log in → same address.
- [ ] Hotkey swap works on localnet (preview label shown).
