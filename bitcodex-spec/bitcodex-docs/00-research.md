# 00 · Research guide and verified findings

## Official sources (in this order)

**Bittensor docs** (raw markdown: `https://www.bittensor.com/llms.mdx/docs/<path>/content.md`, index: https://www.bittensor.com/llms.txt)

| Topic | Page |
|---|---|
| Wallets and keys (coldkey, hotkey, files, security tiers, swaps) | `concepts/wallets` |
| Transaction model (intents, plan/execute, signers) | `concepts/transactions` |
| Advanced submission (proxies, batches, multisig, raw calls) | `concepts/advanced` |
| Money (Balance, TAO vs alpha, rao) | `concepts/money` |
| Staking pools and swap fees | `concepts/staking-pools` |
| Staking guide | `guides/staking` |
| Proxy accounts | `guides/proxies` |
| Multisig | `guides/multisig` |
| Signing with a browser extension | `guides/extension-signing` |
| Ledger, Polkadot Vault | `guides/ledger`, `guides/vault` |
| Mining, registration burn, collateral | `guides/mining`, `guides/mining/burn`, `guides/mining/collateral` |
| Validating, childkeys | `guides/validating` |
| EVM (keys, MetaMask, ss58 ↔ h160) | `guides/evm` |
| Verify substrate keys (ed25519/sr25519 precompiles) | `guides/evm/verify-keys` |
| Address mapping precompile | `guides/evm/precompiles/address-mapping` |
| SDK, CLI | `sdk`, `cli` |
| Wallet options (no official wallet) | https://bittensor.com/wallet |

**Code**
- Chain: https://github.com/RaoFoundation/subtensor (runtime, `common/src/lib.rs`, `docker-compose.localnet.yml`, `sdk/python`).
- BitcodeX: https://github.com/SomeshTalligeriDEV/bitcodeX-infra (branch `develop`, last commit 6306354, 14 May 2026). Docs in `apps/docs_web/docs/v0/` and `documentation/`.
- polkadot.js: https://polkadot.js.org/docs (`@polkadot/api`, `@polkadot/keyring`, `@polkadot/util-crypto`, `@polkadot/extension-dapp`).

**Product reference**
- Privy docs index: https://docs.privy.io/llms.txt. Demo: https://demo.privy.io. Copy behaviour, never code or brand.

Do not trust: blog posts older than 2026, the archived `opentensor/bittensor*` repos, tutorials using Axon/Dendrite/Synapse, and BitcodeX's hosted service (shut down 1 June 2026).

## Do this first (day 1)

1. Pin versions: `npm view @polkadot/api version`, `npm view @polkadot/util-crypto version`, `node --version` (BitcodeX needs 22+), `rustc --version` (BitcodeX's `rust-toolchain`), `wasm-pack --version`.
2. Start localnet: `docker run --rm -p 9944:9944 -p 9945:9945 ghcr.io/raofoundation/subtensor-localnet:devnet` (check the repo's `docker-compose.localnet.yml` for the current image and ports).
3. Run the **Ed25519 probes** in `KICKOFF_PROMPTS.md` Prompt 2 (3a to 3e). Probe 3b (FROST-signed transfer) is the go/no-go for the whole project.
4. Record the results below.

## Facts gathered so far

| Fact | Source | Status |
|---|---|---|
| Subtensor `Signature = MultiSignature` | `RaoFoundation/subtensor` `common/src/lib.rs:38`, commit 8d7f421 (27 Oct 2026) | Read in source 28 Oct 2026 |
| SS58 prefix 42 (addresses start with `5`) | runtime `SS58Prefix: u8 = 42` (`runtime/src/lib.rs:274`) | Read in source 28 Oct 2026 |
| Extension accounts "must be sr25519 or ed25519"; ecdsa accounts refused for extrinsics | docs `guides/extension-signing` | Read 28 Oct 2026 |
| Chain has `ed25519-verify` (0x…0402) and `sr25519-verify` (0x…0403) EVM precompiles | docs `guides/evm/verify-keys` | Read 28 Oct 2026 |
| btcli wallets default to sr25519, 12-word mnemonic, coldkey NaCl-encrypted, hotkeys unencrypted on disk | docs `concepts/wallets` | Read 28 Oct 2026 |
| Proxy types: Any, NonTransfer, Transfer, SmallTransfer (<0.5 TAO), Staking, Registration, ChildKeys, RootClaim, BasketTrading, Validate, Weights, Owner, NonCritical, SubnetLeaseBeneficiary | docs `guides/proxies` | Read 28 Oct 2026 |
| Proxy deposit 0.06 TAO + 0.033 TAO per delegation; max 20 proxies; delays in blocks (~12 s) | docs `guides/proxies` | Read 28 Oct 2026 |
| Coldkey swap: announce (0.1 TAO, 36,000 blocks ≈ 5 days), then execute; hotkey swap 0.1 TAO (all subnets) or 0.001 TAO (one subnet) | docs `concepts/wallets` | Read 28 Oct 2026 |
| BitcodeX Ed25519 = FROST 2-of-2 (client P0 + server P1); client share also SSS-split to key share nodes for backup; produces standard Ed25519 signatures | BitcodeX `apps/docs_web/docs/v0/concepts/threshold-eddsa.md` | Read 28 Oct 2026 |
| BitcodeX routes: `/tss/v2/keygen_ed25519`, `/tss/v2/sign_ed25519/round1`, `/round2`, `/tss/v2/export_shares`, KSN `/keyshare/v2/register/ed25519` | BitcodeX source | Read 28 Oct 2026 |
| BitcodeX hosted service shut down 1 June 2026; repo still Apache-2.0 | `apps/user_dashboard/.../service_shutdown_modal` | Read 28 Oct 2026 |
| BitcodeX chain metadata comes from the Keplr chain registry (no Bittensor entry); we must ship local chain info | BitcodeX `supported-chains.md` | Read 28 Oct 2026 |
| BitcodeX backend env requires S3_* and SMTP_*; Elasticsearch optional | `backend/bitcodex_api/server/src/envs.ts` | Read 28 Oct 2026 |
| Privy wallets for "Tier 3" chains are EVM, Solana, Tempo, Tron; Privy curves secp256k1, Ed25519, Starknet; no Bittensor | Privy docs | Checked 28 Oct 2026 |

**Not verified yet (the agent must check):** that a FROST-aggregated Ed25519 signature over a Subtensor signer payload is accepted (probe 3b); which signed extensions Subtensor requires (e.g. `CheckMetadataHash`, custom subtensor extensions); whether btcli/SDK v11 tools work with ed25519 coldkeys (we do not need them, but note it); MEV-shield behaviour for stake calls from JS.

## Verified findings

(The agent appends dated entries: what was checked, the command, the real output, and what it means.)
