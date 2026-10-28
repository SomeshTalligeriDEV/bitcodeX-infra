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

### 2026-10-28 — toolchain, FROST build, offline signature compatibility (M2 Mac)

**Toolchain (pinned):** node v22.21.1, yarn 4.12.0 (corepack), rustc 1.93.1 (repo `rust-toolchain`), wasm-pack 0.13.1 (workspace npm dep of `frost_ed25519_cosmos_compat_wasm`). `npm view`: `@polkadot/api` 17.0.2 (published 2026-10-01), `@polkadot/keyring` 14.0.3 and `@polkadot/util-crypto` 14.0.3 (2026-03-23). Probe folder `scratch/probe/` (gitignored) pins exactly these.

**Install/build:** `corepack yarn install --immutable` → "Done with warnings in 4m 5s" (YN0007 native builds, peer warnings only). `corepack yarn ci build_frost` → exit 0: "Done teddsa addon", "Done build wasm frost cosmos_compat", "Done copy wasm frost". Only a Rust deprecation warning (`GenericArray::as_slice`, `frost_ed25519_cosmos_compat/src/tss/mod.rs:133`).

**Localnet image (resolves start.md vs this file):** ghcr registry API, anonymous token: `ghcr.io/raofoundation/subtensor-localnet:devnet` → HTTP 200, multi-arch (linux/amd64, linux/arm64), arm64 digest `sha256:c2d0e4ae37295290261eb6cab49f014b5707481aa926847e9b764cb3fd1a8f09`, 112 MB compressed / 11 layers. `ghcr.io/raofoundation/subtensor:latest-local` → 404 (it is only the local build tag in `docker-compose.localnet.yml`). So a prebuilt localnet image exists; no source build needed.

**Offline pre-check for probe 3b** (`scratch/probe/probe_offline.mjs`; both FROST shares in one process, random throwaway seed; no chain): keygen via `cli_keygen_seed_ed25519`, sign via `cli_sign_round1/round2/aggregate_ed25519`, verify with polkadot.js.
```
address      5GhmRiDDMa6ncgmSHyMJPuvsmrNKzDkYpZS59YCGBzWge1Xh
PASS  address starts with 5
PASS  decodeAddress round-trips to group pubkey
PASS  keyring ed25519 from same seed = FROST group key (RFC 8032 compatible)
PASS  len=32|200|256|257|1000: ed25519Verify(FROST sig)
PASS  len=32|200|256|257|1000: signatureVerify(0x00||sig, ss58) -> crypto=ed25519
PASS  tampered message rejected
OFFLINE PRE-CHECK PASSED
```
Meaning: FROST aggregate signatures are standard Ed25519 that polkadot.js verifies as `MultiSignature::Ed25519` for `encodeAddress(groupKey, 42)`, including the >256-byte blake2_256 path. **This is not probe 3b** (the chain has not accepted a tx yet). Side result for X07: the FROST group key equals `Keyring({type:'ed25519'}).addFromSeed(seed)`, so an exported seed imports directly into polkadot.js with the same address.

### 2026-10-28 — localnet up; probes 3a and 3b PASS (go/no-go passed)

**Localnet:** Colima 0.10.3 (4 CPU / 8 GB / 60 GB), Docker 29.5.2 arm64.
`docker run -d --name subtensor-localnet -p 9944:9944 -p 9945:9945 ghcr.io/raofoundation/subtensor-localnet:devnet`
Image digest `sha256:64f56c4b5485c2bf1f299ce792423517217acd7e763549dab311c74e784bee2b`, created 2026-10-23.
RPC: `system_chain` = "Bittensor" (same name as mainnet: do not use chain name to detect localnet), `system_chainType` = "Local", `system_name` = "Subtensor Node", `system_version` = "4.0.0-dev-5749dbfbe4a", `system_properties` = `{"ss58Format":42,"tokenDecimals":9,"tokenSymbol":"TAO"}`, genesis `0xda4f6b75d463bc28dc6d833bb07dbe356ebf1c37aeeb214f57d2e42599fcee1c`. Runtime `node-subtensor` spec 484, transactionVersion 1.

**Signed extensions (from metadata, in order):** CheckNonZeroSender, CheckSpecVersion, CheckTxVersion, CheckGenesis, CheckMortality, CheckNonce, CheckWeight, ChargeTransactionPayment, SudoTransactionExtension, CheckShieldedTxValidity, SubtensorTransactionExtension, DrandPriority, CheckMetadataHash. polkadot.js 17.0.2 logs `Unknown signed extensions SudoTransactionExtension, CheckShieldedTxValidity, SubtensorTransactionExtension, DrandPriority found, treating them as no-effect`; transfers still succeed, so these add no signed payload bytes for these calls. Re-check if a call ever fails with `BadProof`/`Invalid transaction`.
**Existential deposit:** `api.consts.balances.existentialDeposit` = 500 rao.

**Probe 3a** (`node scratch/probe/probe_3ab.mjs 3a`, @polkadot/keyring ed25519 pair, random seed):
```
[3a keyring-ed25519] address=5EhVr8qPDttoLC6LhkEMt9aPzLM4uF2Lqp1Gng4MH2Szrjbg
Alice -> ed25519 10 TAO  tx=0x9c410b9b0ac284165198b6c1ac329015bb1ada4d0c7818c3df714d130a3e8f83
balance after fund: 10000000000 rao
ed25519 -> Alice 1 TAO   tx=0xef2c9b7fb89999a810d24513725d0406835011e370e7fa568302f35af2b28b00
balance after send-back: 8999916876 rao  (PASS)
```

**Probe 3b — GO** (`node scratch/probe/probe_3ab.mjs 3b`). Key from `cli_keygen_seed_ed25519`; polkadot.js `Signer.signPayload` builds `ExtrinsicPayload(...).toU8a({ method: true })`, signs with FROST `cli_sign_round1_ed25519` ×2 → `cli_sign_round2_ed25519` ×2 → `cli_aggregate_ed25519`, returns `0x00 || sig` (MultiSignature::Ed25519). Both shares in one process (probe only, not the product flow).
```
[3b frost-ed25519] address=5GuR4c6TSz3xd5gVaRKAVyYLjZuL6rNWGZ6NESe7RDsFHAtV
Alice -> ed25519 10 TAO  tx=0xf53738bc75bdce12203213603ac2c3bf7431f81389e095cca33104bd3e167b83
balance after fund: 10000000000 rao
ed25519 -> Alice 1 TAO   tx=0x7661eee2621cf8a330b681c33ab942aeb5bf6df9c886949ae6f863a53aec39dc
balance after send-back: 8999916876 rao  (PASS)
```
Fee identical to 3a (83,124 rao): the chain treats a FROST key as an ordinary ed25519 account.

**Probe 3b-long** (`node scratch/probe/probe_3ab.mjs 3b-long`): `utility.batchAll` of 10 `system.remark`, FROST-signed.
```
[3b-long] signer payload 511 bytes (blake2_256 path)
[3b-long] utility.batchAll(10 x remark) tx=0xc186a42a60ba8bf5833dd01b69640a2dee24ee6e0e802535f8840672e7a321bc  (PASS)
```

**Meaning:** BitcodeX's FROST 2-of-2 Ed25519 signatures are accepted by Subtensor for short and >256-byte payloads. The fallback in 06-build-order.md is not needed. Still open: probes 3c (add/remove stake), 3d (burned_register), 3e (Staking proxy) need a localnet subnet + validator hotkey; MEV-shield behaviour for stake calls; `CheckShieldedTxValidity` semantics.
