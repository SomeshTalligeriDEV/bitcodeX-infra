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

### 2026-10-28 — probes 3c, 3d, 3e from a FROST ed25519 coldkey (localnet)

All on localnet (`system_chainType` = Local, ws://127.0.0.1:9944, //Alice dev funds, random throwaway keys). Script: `node scratch/probe/probe_3cde.mjs` (helpers in `scratch/probe/lib.mjs`; `send()` also fails on `proxy.ProxyExecuted { result: Err }`, because a failed inner proxy call does not fail the outer extrinsic).

**Metadata read from the chain first** (`scratch/probe/meta.mjs`, `meta2.mjs`):
- `subtensorModule.registerNetwork(hotkey)`, `startCall(netuid)` (subnet owner only; emits `FirstEmissionBlockNumberSet`), `addStake(hotkey, netuid, amountStaked: TaoBalance)`, `removeStake(hotkey, netuid, amountUnstaked: AlphaBalance)`, `burnedRegister(netuid, hotkey)`, `addStakeLimit(hotkey, netuid, amountStaked, limitPrice, allowPartial)`, `removeStakeLimit(...)`.
- `proxy.addProxy(delegate, proxyType, delay)`, `proxy.proxy(real, forceProxyType: Option<ProxyType>, call)`, `removeProxy(...)`.
- **ProxyType is `SubtensorRuntimeCommonProxyProxyType`** with 21 variants: Any, Owner, NonCritical, NonTransfer, Senate, NonFungible, Triumvirate, Governance, Staking, Registration, Transfer, SmallTransfer, RootWeights, ChildKeys, SudoUncheckedSetCode, SwapHotkey, SubnetLeaseBeneficiary, RootClaim, BasketTrading, Validate, Weights. polkadot.js's built-in `ProxyType` only knows Any/NonTransfer/Governance/Staking: always use the metadata type.
- consts: `proxy.proxyDepositBase` 60,000,000 rao, `proxyDepositFactor` 33,000,000 rao (docs match). `initialStartCallDelay` 0, `initialMaxRegistrationsPerBlock` 1, `initialNetworkMinLockCost` 1,000 TAO. Localnet block time ≈ 0.30 s (fast blocks).
- Stake reads: runtime API `stakeInfoRuntimeApi.getStakeInfoForHotkeyColdkeyNetuid(hotkey, coldkey, netuid)` (stake in alpha rao). There is no `subtensorModule.alpha` storage; it is `alphaV2`.
- Runtime APIs present: stakeInfo, subnetInfo, delegateInfo, neuronInfo, swapRuntimeApi, proxyFilterRuntimeApi, shieldApi, subnetRegistrationRuntimeApi, transactionPaymentApi, …

**Results (11/11 steps PASS):**
```
setup  Alice registerNetwork(validatorHk)         netuid=2 tx=0x1524e4f29c1e1eda29c5f1522ef7eb1a93e0439acaed5fbad934f6a34c2546c8
setup  Alice startCall(2)                         tx=0xac318b0ec21cdeff979dfc696a5393e5b797cf58f0d4d0aa869f200ddb978a7a
setup  Alice addStake(validatorHk, 2, 100 TAO)    tx=0x9941e30e68472167b2d1968daef3c81bf2f3e45625976c61773ce2556b85af91
setup  Alice -> FROST 500 TAO                     tx=0xa3fe132a36af4274aeb280f040ef3a0099df86dc22020d639024bb2c990e1e02
FROST coldkey 5CvJzNC6fGLeui3HyJPABPcdGb4tepz94dn6HFg4kDink7bs
3c  add_stake 50 TAO (FROST)        PASS tx=0x8da9f25da6b723718758f5ebf19d0695dd13496d00bf28ac8b04143ec653d89f stake=39510192204 alpha-rao
3c  remove_stake half (FROST)       PASS tx=0x9b23fd9dd49b4450ab3ef3ad042c249e33ed6b78a71b025dd787f3958f96c438 stake 40911922126 -> 20455961063; free 449.999187277 -> 476.413354782 TAO
3d  burned_register sr25519 hotkey  PASS tx=0xfb8a6c7701d8f60e28388240b83ea537f020ea207d393426b3bd8d23e2fccb77 uid=1, owner(hotkey)=FROST coldkey
3e  add_proxy(agent, Staking, 0)    PASS tx=0x2ed82bed96b258e4b3c382a7a5cd028b0e92c4385bf6f694ba6295dece1d7ab0 deposit 0.093 TAO reserved
3e  agent proxy.proxy(addStake 1)   PASS tx=0xf1067bcc4f2a1614336f500134c5f48a2f2ad85f9c3d80e4fba734fb125f510b FROST stake 20455961063 -> 22387267800, FROST free -1 TAO, no FROST signature
3e  agent proxy.proxy(transfer)     PASS (rejected) system.CallFiltered, tx=0xc07dd10ecbcd875b61fad1a45fccea0b19f5202cb96b8e1549b979e11f60fcf7
```
Notes:
- Unshielded stake calls from JS succeed on localnet: no MEV-shield step was needed (re-check on testnet).
- Stake grew between 3c steps (39.51 → 40.91 alpha) from emissions; read stake right before unstaking, never cache it.
- **Open (affects X08 "burn shown = burn charged"):** `subtensorModule.burn(2)` read at the parent block = 979,043,208 rao, but the coldkey's balance dropped by 977,159,963 rao + fee (fee `balances.Withdraw` 1,070,891 rao); 1,883,245 rao (≈0.19%) less than the stored `Burn`. At the inclusion block `Burn` rose to 1,231,221,553 (burn adjusts after each registration). Cause not yet found: read the `burned_register` source before building X08's cost display.
- 3e matches X09's design: the chain enforces the Staking proxy (CallFiltered on transfer), the agent pays its own fees, and the user's shares are not used.

**Phase 0 status:** probes 3a, 3b, 3b-long, 3c, 3d, 3e PASS on localnet. One open item (burn amount accounting) for X08.

### X05 stake units (verified on localnet, 2026-10-28)
- Runtime APIs present: `swapRuntimeApi.currentAlphaPrice(netuid)`, `currentAlphaPriceAll()`, `simSwapTaoForAlpha(netuid, tao)`, `simSwapAlphaForTao(netuid, alpha)`, `stakeInfoRuntimeApi.getStakeInfoForColdkey(coldkey)`, `getStakeInfoForHotkeyColdkeyNetuid`, `getStakeFee(...)`, `subnetInfoRuntimeApi.getDynamicInfo(netuid)` (`subnetName` comes back as bytes).
- Price unit: rao of TAO per 1 alpha (`1000000000` = 1 TAO/alpha). `limitPrice` on `addStakeLimit` / `removeStakeLimit` uses the same unit.
- `simSwapTaoForAlpha(50 TAO)` predicted 47596210440 alpha; the real `addStake` gave exactly 47596210440 (tx `0x05fe378a…990e4d`). A 50 TAO stake into a fresh 1000 TAO pool moved the price from 1.0 to about 1.10 TAO/alpha.
- `addStakeLimit` with a limit below the current price fails with `swap.PriceLimitExceeded`; 2x the price succeeds (tx `0x6af9e95e…3815f0`). `removeStakeLimit` is the reverse: a limit above the price fails, half the price succeeds (tx `0xb4a3440c…b766e2`).
- `StakeAdded` / `StakeRemoved` event data: (coldkey, hotkey, tao rao, alpha, netuid, fee).
- Plan for X05: limit price = current price × (1 + slippage) for stake, × (1 − slippage) for unstake (default 1%), with price impact shown from the simulation. Sign-in-with-Bittensor is waiting until its message format is verified.

### Limit price and localnet stability (verified 2026-10-29)
- `addStakeLimit` checks `limitPrice` against the price AFTER the swap: a limit between the average fill price and the end price failed with `subtensorModule.SlippageTooHigh`; above the end price it succeeded. End price = average² / spot.
- Quote vs fill: emissions change the pool every block; a 50 TAO stake on a fresh subnet filled 0.13% below the quote one or two blocks later.
- The localnet image runs 3 validator nodes in one container. After about 8 h on a 4-CPU / 8 GB Colima VM they used about 6.7 GB and reorged by up to 26 blocks. Transactions then failed as "bad signature" or never landed. A container restart fixed it (fresh chain; reseed with `seed_localnet.mjs`). Parallel test files sending from //Alice collide on the nonce ("temporarily banned"), so `test:localnet` runs with `--runInBand`.

### Sign-In with Bittensor (researched 2026-10-29)
- CAIP-122 (standards.chainagnostic.org/CAIPs/caip-122) defines the message template and data model, and requires each namespace to define a profile (signing algorithm, `type`, signing input). **The Polkadot namespace has no CAIP-122 profile** (`namespaces.chainagnostic.org/polkadot/caip122` returns 404).
- CAIP-2 Polkadot chain id: `polkadot:` + the first 32 hex characters of the genesis hash, lowercase (namespaces.chainagnostic.org/polkadot/caip2). For the current localnet genesis that is `polkadot:da4f6b75d463bc28dc6d833bb07dbe35`.
- CAIP-10 Polkadot account address: SS58 with the chain's own prefix (42 here).
- BitcodeX profile (`sdk/bitcodex_bittensor_chain/src/siwb.ts`):
  - message: the CAIP-122 template with blockchain name "Bittensor" and `Chain ID: polkadot:<ref>`;
  - signing input: `<Bytes>message</Bytes>`;
  - verification: `signatureVerify`, plus domain, nonce, chain and expiry / not-before checks.
- A real FROST 2-of-2 ed25519 signature over a SIWB message verified against the live localnet genesis: `{"ok":true,"crypto":"ed25519"}`.
- The iframe refuses to sign a SIWB message whose domain is not the requesting site's host (phishing), or whose address or chain differs from the wallet's.
- Packaging fix found on the way: `@bitcodex/bittensor-chain` `dist` used extensionless relative imports, which plain Node ESM cannot load. `tsc-alias resolveFullPaths` now adds `.js`.

### X08 registration cost (verified to the rao, localnet 2026-10-29)
- **Cause of the 0.19% gap from probe 3d:** `on_initialize` decays every subnet's `Burn` once per block, before extrinsics run (subtensor `subnets/registration.rs` `update_registration_prices_for_networks`). So a registration is charged the *next* block's decayed price, not the stored `Burn`. `BurnHalfLife` = 360 blocks gives f = 0.5^(1/360) = 0.998076 per block, which is the 0.1924% gap.
- **Exact formula,** ported from `utils/misc.rs`:
  - `decay_factor_q32(360)` = 4286705684 (Q32);
  - next burn = clamp((burn × f) >> 32, `MinBurn`, `MaxBurn`).
- 8 of 8 block-to-block predictions were exact. A registration's actual charge equalled the prediction: 3050502 rao, plus the 1070891 rao tx fee.
- Total charge = burned share + collateral top-up = the full decayed price for a fresh hotkey (`subnets/collateral.rs` `pay_registration`). `CollateralLockShare` is 0 on localnet, so nothing is kept as collateral there.
- `MaxRegistrationsPerBlock` = 1. `registerLimit(netuid, hotkey, limitPrice)` exists and fails with `RegistrationPriceLimitExceeded` when the price is above the limit.
- **"Shown = charged":** the shown price is exact only for inclusion in the next block; each later block makes it 0.19% cheaper. So the popup and demo show the next-block cost live (recomputed every block). The SDK submits `registerLimit` capped at the shown cost, so it never charges more, and reports the exact `charged` from chain state after inclusion. Test example: shown 1542910, landed 2 blocks later, charged 1536979 = the parent's burn decayed one block.
- Storage: `Owner(hotkey)` (Default; the all-zero account means unowned), `OwnedHotkeys(coldkey)`, `Uids(netuid, hotkey)` (Optional), `IsNetworkMember(hotkey, netuid)`.
- Hotkey creation (bittensor.com/docs/concepts/wallets): `btcli wallet new-hotkey -w my_coldkey -H my_hotkey`, "on a trusted workstation"; `btcli wallet show` prints public keys.
- Localnet stability: with the demo compiling at the same time, the 3-node localnet hit 800% CPU and logged 195 fork/reorg events in 15 min. Two tests timed out; a rerun passed 55/55.

### X07 export and key swaps (verified 2026-10-29)
- The iframe stores only the client's **share** of the ed25519 seed (2-of-2 SSS point, x = SEED_ID_CLIENT). Normal login rebuilds that share from the KSNs, not the seed. The full seed is rebuilt only in `export_private_key.ts`, after re-auth, by combining with the server's seed share, inside the iframe. That is the one allowed exception.
- Portability: for 5 of 5 random seeds, polkadot.js `Keyring({ type: "ed25519" }).addFromSeed(seed)` gives the same SS58 address as the FROST group key from `cli_keygen_seed_ed25519(seed)`.
- `scripts/local/check_export_portability.mjs` (same WASM as the iframe): seed SSS split → combine → `addFromSeed` = coldkey address PASS; keystore JSON (`toJson(password)`, encoding pkcs8/ed25519) → `addFromJson` + unlock = same address PASS; wrong password rejected PASS; the imported key signed a localnet transfer, tx `0x1fe9692461b2cb65320beb2184c06b27866e207f56ee0b898e5fb90c9ae5def0`.
- Hotkey swap: `swapHotkey(hotkey, newHotkey, netuid: Option<u16>)`. All subnets charged exactly `KeySwapCost` = 100000000 rao (0.1 TAO); one subnet exactly `KeySwapOnSubnetCost` = 1000000 rao. Events `HotkeySwapped` / `HotkeySwappedOnSubnet`; the UID moves to the new hotkey.
- Coldkey swap: `announceColdkeySwap(newColdkeyHash: H256)`, then `swapColdkeyAnnounced(newColdkey)` after `ColdkeySwapAnnouncementDelay` (50 blocks on localnet); `disputeColdkeySwap`, `clearColdkeySwapAnnouncement`. `scheduleSwapColdkey` is marked deprecated in metadata. The mainnet delay is not verified here.
- Dev machine limit: this Mac has 8 GB RAM and the Colima VM was allowed all 8 GB. The 3-node localnet grew to 4.5 GB, swap filled (8.4 / 9.2 GB), the Mac hung and the typecheck was OOM-killed (exit 137). Mitigations: restart the localnet container (back to about 340 MB), stop the frontends when not testing in the browser, and `BITCODEX_CI_CONCURRENCY=2 yarn ci typecheck`.

### X09 permissions and connection robustness (verified 2026-10-29)
- What each ProxyType allows comes from the chain: `api.call.proxyFilterRuntimeApi.getProxyFilters(null)`. Names are hex-encoded bytes, and the mode is allow/deny with optional `paramLessThan` constraints.
  - **SmallTransfer** allows `transfer_keep_alive` / `transfer_allow_death` with `value < 500000000` (0.5 TAO), and `transfer_stake` / `transfer_stake_and_hotkey` with `alpha_amount < 500000000`.
  - **Staking** allows add/remove/move/swap stake (and the limit variants) plus `unstake_all*`.
  - **Registration** allows `register`, `register_limit`, `burned_register`, `pow_register`.
- Deposit for one delegation = `proxyDepositBase + proxyDepositFactor`; each further delegation adds `proxyDepositFactor`.
- X09 acceptance passed on localnet (`tests/permissions.localnet.test.ts`, agent = its own sr25519 key, via `actAs` = `proxy.proxy` + `ProxyExecuted` check):
  - Staking: the agent staked 1 TAO for the user; the agent's transfer was rejected with `CallFiltered`.
  - SmallTransfer: 0.4 TAO OK, 0.6 TAO `CallFiltered`.
  - Revoke: the deposit came back exactly; the next agent action gave `NotProxy`.
- Demo agent route (`apps/demo_web/src/app/api/agent`, key `//BitcodeXDemoAgent` from env), tested with curl and a test user:
  - 403 before the grant;
  - after the Staking grant, staked 1 TAO with no user popup, tx `0x6425465f80bc55548dd405f807799a9216ea524653a2f06d91b1e0d2de73e894`;
  - the second 1 TAO against a 1.5 TAO daily limit was refused (429, Preview policy enforced by the agent server, not the chain);
  - 403 after the revoke.
- **Bug found and fixed:** after a localnet restart (new genesis), long-running servers using the cached `getApi` connection hung forever (the faucet stopped answering). `getApi` now re-checks `chain_getBlockHash(0)` against the cached genesis with a 10 s timeout, reconnects once if it changed or does not answer, and times out the chainType call. Verified: localnet restarted under the running API, and the next faucet drip succeeded in 1 s with no API restart.

### Testnet (verified 2026-10-29)
- Official endpoints (bittensor.com/docs/concepts/network): testnet `wss://test.finney.opentensor.ai:443`, mainnet `wss://entrypoint-finney.opentensor.ai:443`, local `ws://127.0.0.1:9944`. The page lists **no testnet faucet**. Older community guides disagree (`btcli wallet faucet` vs "faucet is disabled on testnet"), so BitcodeX links none.
- Live testnet, read-only probe:
  - `system_chain` "Bittensor", **chainType `Development`**;
  - genesis `0x8f9cf856bf558a14440e75569c9e58594757048d7b3a84b5d25f6bd978263105`;
  - spec 486 (`node-subtensor`), txVersion 1, SS58 42, 9 decimals, symbol `testTAO`, ED 500;
  - the same 13 signed extensions as localnet; `proxyFilterRuntimeApi`, `swapRuntimeApi`, `stakeInfoRuntimeApi` and `registerLimit` present; 600 subnets.
- Mainnet, read-only (genesis + chainType only): genesis `0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03`, chainType `Live`. Now used to refuse it by name ("this endpoint is Bittensor MAINNET").
- **FROST signatures are valid on testnet** (nothing spent): a FROST 2-of-2 signed `transferKeepAlive` from an unfunded account was rejected with `1010 Inability to pay some fees`, the same as an unfunded normal key. The control with a corrupted signature was rejected with `1010 Transaction has a bad signature`. Substrate checks the signature before fees, so the payload format and signature are accepted. A funded testnet transfer is still to do (needs testnet TAO).
- Because testnet reports `Development`, the localnet rule's endpoint check matters. Verified: `getApi("bittensor:localnet", { rpcUrl: testnet })` → "endpoint … is not local".
