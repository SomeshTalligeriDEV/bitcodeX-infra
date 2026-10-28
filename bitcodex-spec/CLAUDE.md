@AGENTS.md

# CLAUDE.md: BitcodeX for Bittensor

You are building **BitcodeX**: a Privy-style embedded wallet stack for Bittensor. Users sign in with email, social login or a passkey; a Bittensor coldkey is created for them as a 2-of-2 threshold Ed25519 key (browser share + server share, backed up on key share nodes); apps integrate with one SDK.

BitcodeX's own engineering rules are in `AGENTS.md` (imported above). Follow them. This file adds the Bittensor-specific rules. Where they conflict, this file wins.

Read before every session: this file, `bitcodex-docs/00-research.md`, `bitcodex-docs/01-bitcodex-codebase-map.md`, `bitcodex-docs/02-bittensor-wallets.md`, `bitcodex-docs/03-architecture.md`, and the spec of the feature you are working on.

## 1. Research before code (mandatory)

1. Bittensor changes fast. The source of truth is **https://www.bittensor.com/docs** (raw pages: `https://www.bittensor.com/llms.mdx/docs/<path>/content.md`) and the chain source **https://github.com/RaoFoundation/subtensor**. Read the relevant pages before each feature.
2. BitcodeX is unmaintained since June 2026. Read the BitcodeX code you are about to change, end to end, before changing it. Do not assume docs match code.
3. Run the smallest probe first (one RPC call, one signed transfer on localnet) and paste the real output into `bitcodex-docs/00-research.md` under "Verified findings" with the date.
4. Never invent an extrinsic, RPC method, SDK function, signed extension or CLI flag. If you cannot verify it, stop and ask.
5. Privy is the product reference (https://docs.privy.io). Copy behaviour and UX, never code or brand assets.

## 2. Hard safety rules (never break these)

- **Networks:** localnet (`ghcr.io/raofoundation/subtensor-localnet:devnet`) and testnet only. **Mainnet is disabled** behind a build flag `BITCODEX_ENABLE_MAINNET=false` until an external security audit. Show mainnet in the UI as disabled with a tooltip.
- **The full coldkey private key must never exist in one place.** No code path may combine the client share and server share. The only exception is the user-initiated **Export key** flow (X07), which runs inside the iframe, behind re-authentication, and never sends the result over the network.
- **Key shares never leave their owner** except as BitcodeX already designs (SSS fragments to key share nodes, encrypted). Never log a key share, seed, mnemonic, signature nonce, JWT or OAuth token. Add a lint/grep check for this.
- **Hotkeys are not coldkeys.** Hotkeys are normal sr25519 keys created on the machine that runs the miner or validator. BitcodeX only stores hotkey public addresses. Never generate a hotkey inside the threshold system.
- **The iframe is the only place that signs.** Host apps get signatures and addresses, never shares. Every signature needs a visible confirmation modal that shows a decoded, human-readable summary of the call (amount, destination, netuid, hotkey) and the fee. Unknown calls show the raw call and a red "Unknown call" warning.
- **No secrets in code or chat.** OAuth client IDs, JWT secret, encryption secrets, SMTP passwords go in `.env` files (gitignored). Ship `.env.example` with empty values. Replace every hard-coded BitcodeX client ID.
- **$0 budget.** Self-host everything on our own machines (Postgres in Docker, MinIO for S3, Mailpit or a Gmail app password for email). No paid service.
- **Licence:** keep the `LICENSE` and `NOTICE` files as-is. Do not use any third-party name or logo in the product UI.

## 3. Scope rules

Tiers are in `bitcodex-docs/04-privy-parity.md` and `bitcodex-docs/06-build-order.md`:

- **BUILD:** must work live on localnet, end to end.
- **PREVIEW:** real screen, at most one simulated action, labelled "Preview".
- **ROADMAP:** slide only. **OUT:** do not build.

Do not start a later phase while an earlier phase's acceptance checks fail.

## 4. How to change this codebase

- Add Bittensor as a **new ecosystem next to SVM**, mirroring the SVM files (see the copy map in `01-bitcodex-codebase-map.md`). Do not modify the SVM, EVM or Cosmos paths except where a shared type must learn about the new ecosystem.
- Reuse BitcodeX's Ed25519 keygen and FROST signing as-is. Do not touch `crypto/` Rust unless a probe proves it is necessary; if so, stop and ask.
- Bittensor chain access uses `@polkadot/api` (pin the version). Address encoding uses `@polkadot/util-crypto` `encodeAddress(pubkey, 42)`.
- Every new route: Zod schema + OpenAPI registration, as `AGENTS.md` describes.
- Run `yarn ci typecheck`, `yarn exec biome check --write .` and `cargo check --workspace` before each commit.
- Commit format (BitcodeX's): `<scope>: <description>`, e.g. `sdk_bittensor: add signAndSend`. Commit after each acceptance check passes.

## 5. Definition of done

A feature is done when every acceptance check in its spec passes on a fresh localnet from the demo app UI (not a script), the step is added to `bitcodex-docs/08-demo.md`, and no secret or key material appears in logs (check server logs and the browser network tab).

## 6. When unsure

Stop and ask. Give one recommended option and why. Never guess on anything that touches keys, signatures, money or the chain.
