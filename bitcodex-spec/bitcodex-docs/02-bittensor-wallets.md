# 02 · How Bittensor wallets work (primer for the agent and the team)

Facts marked **[docs]** come from bittensor.com/docs (read 28 Oct 2026), **[source]** from `RaoFoundation/subtensor`, **[standard]** from Substrate/polkadot.js behaviour that the agent must confirm on localnet.

## 1. A wallet is two kinds of keys

| | Coldkey | Hotkey |
|---|---|---|
| Purpose | Holds TAO and stake; owns subnets and hotkeys | Operational identity on subnets (gets the UID) |
| Signs | transfers, staking, registration, subnet ownership, proxies, swaps **[docs]** | weights, axon serving, signed HTTP requests between validators and miners **[docs]** |
| Where it lives (btcli) | `~/.bittensor/wallets/<name>/coldkey`, NaCl-encrypted with a password; `coldkeypub.txt` is public **[docs]** | `~/.bittensor/wallets/<name>/hotkeys/<hk>`, **unencrypted** on disk **[docs]** |
| Risk if leaked | all funds | UID reputation, not TAO **[docs]** |
| **In BitcodeX** | **the user's MPC wallet**: FROST 2-of-2 Ed25519 (browser share + server share) | **a normal sr25519 key created on the machine that runs the miner/validator**; BitcodeX stores only its address |

One coldkey can own many hotkeys **[docs]**.

## 2. Keys and addresses

- Key types the chain accepts for extrinsics: **sr25519 and ed25519** (ecdsa is refused for Substrate extrinsics) **[docs: extension-signing]**. Runtime `Signature = MultiSignature` **[source]**.
- btcli default: sr25519 from a 12-word BIP39 mnemonic **[docs]**.
- Address = SS58 encoding of the 32-byte public key with prefix **42** (starts with `5`) **[source]**. In JS: `encodeAddress(publicKey, 42)` from `@polkadot/util-crypto`. For sr25519 and ed25519, the AccountId is the raw public key **[standard]**.
- So a BitcodeX coldkey address = `encodeAddress(frostGroupPublicKey, 42)`.

## 3. How a transaction is signed (what the iframe must do)

1. App builds a call, e.g. `api.tx.balances.transferKeepAlive(dest, amount)`.
2. polkadot.js builds the **signer payload**: call + signed extensions (era/mortality, nonce, tip, spec version, transaction version, genesis hash, block hash, and any Subtensor-specific extensions, e.g. metadata hash) **[standard; verify the exact list in the runtime]**.
3. The bytes to sign = SCALE-encoded payload; **if longer than 256 bytes, sign `blake2_256(payload)` instead** **[standard]**. Use `api.registry.createType('ExtrinsicPayload', payload, { version: payload.version }).toU8a({ method: true })`.
4. Signature for MultiSignature is **type-prefixed**: `0x00` + 64 bytes for Ed25519, `0x01` for sr25519 **[standard]**. A polkadot.js `Signer.signPayload` must return `{ id, signature }` with that prefixed signature.
5. Submit; watch events `ExtrinsicSuccess` / `ExtrinsicFailed`, decode errors with `api.registry.findMetaError`.

Fees: `api.tx...paymentInfo(address)` before signing. Amounts are in **rao** (1 TAO = 10^9 rao) **[docs: money]**. Accounts need an existential deposit to exist **[standard; read the value from `api.consts.balances.existentialDeposit`]**.

## 4. What users do with a coldkey (the actions BitcodeX must support)

| Action | Call (verify names in metadata) | Notes |
|---|---|---|
| Send TAO | `balances.transferKeepAlive` / `transferAllowDeath` | show fee first |
| Stake / unstake | `subtensorModule.addStake`, `removeStake`, `_limit` variants, `moveStake`, `swapStake`, `unstakeAll` | stake buys subnet alpha through the subnet pool, fee ≈ 0.05% **[docs: staking-pools]**; stake calls may go through MEV shield **[docs]** |
| Register a hotkey on a subnet | `subtensorModule.burnedRegister(netuid, hotkey)` | coldkey pays the burn **[docs: mining/burn]** |
| Create a subnet | `subtensorModule.registerNetwork` | localnet only for us |
| Proxies (app permissions) | `proxy.addProxy(delegate, type, delay)`, `removeProxy`, `proxy.proxy(real, type, call)` | see §5 |
| Swap hotkey | `swap_hotkey` | 0.1 TAO all subnets, 0.001 TAO one subnet, once per ~day per subnet **[docs]** |
| Swap coldkey (leaked key) | `announce_coldkey_swap` → wait 36,000 blocks (~5 days) → `swap_coldkey_announced`; `dispute_coldkey_swap` | first announce costs 0.1 TAO **[docs]** |
| Sign a message | raw sign of `<Bytes>…</Bytes>`-wrapped message **[standard polkadot.js signRaw]** | used for "Sign in with Bittensor" |

## 5. Proxies = Bittensor's built-in "signers and policies"

A coldkey can grant another key a **typed, optionally delayed** permission, enforced by the chain **[docs: proxies]**:

- Types: `Any`, `NonTransfer`, `Transfer`, `SmallTransfer` (each transfer < 0.5 TAO), `Staking`, `Registration`, `ChildKeys`, `RootClaim`, `BasketTrading`, `Validate`, `Weights`, `Owner`, `NonCritical`, `SubnetLeaseBeneficiary`.
- Deposit: 0.06 TAO + 0.033 TAO per delegation, refunded on removal. Max 20 proxies per account.
- Delay (blocks, ~12 s each): a delayed delegate must announce a call hash and wait; the owner or a NonTransfer proxy can reject it.
- `Staking` proxy cannot use `Utility.batch_all` (fails `CallFiltered`).

**BitcodeX use:** an app or AI agent gets its own key (server-side, ordinary sr25519), and the user grants it e.g. a `Staking` or `SmallTransfer` proxy from their MPC coldkey. The agent can then act within limits without touching the user's shares. This is Privy's "session signers + policies", but enforced on chain (X09).

## 6. Multisig

Native multisig gives M-of-N control of a coldkey **[docs: multisig]**. Roadmap for team/treasury wallets (Privy "key quorums").

## 7. EVM side

- Subtensor EVM chain IDs: 964 mainnet, 945 testnet. Ethereum-style H160 accounts map to a "mirror" SS58 account; the `address-mapping` precompile (`0x…080c`) returns it **[docs]**. Confirm the formula in source before computing it in JS.
- BitcodeX already has threshold **secp256k1** (EVM) wallets. BitcodeX can give each user an EVM address on Subtensor EVM too (X13).

## 8. What existing tools expect

- btcli/SDK v11 can sign through a browser extension bridge (`--signer extension`) and through `prepare_call` + `submit_signature` for external signers **[docs: extension-signing]**. That means a BitcodeX user could later sign btcli commands too (Roadmap).
- Extensions (Talisman, SubWallet, Polkadot.js) use `@polkadot/extension-dapp` / `injectedWeb3`. BitcodeX should inject itself the same way so any Bittensor dApp can "connect BitcodeX" (X02).

## Verified from docs (dated)

(Prompt 2 adds facts here.)
