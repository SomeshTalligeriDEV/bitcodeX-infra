# X13 · Subtensor EVM address for each user

**Tier:** PREVIEW · **Phase:** 6

## Goal
Each user also gets an EVM (H160) address on Subtensor EVM (testnet chain id 945; localnet EVM endpoint) using BitcodeX's existing threshold secp256k1 wallet, so Solidity dApps work with the same login.

## Research first
- Docs `guides/evm`, `guides/evm/precompiles/address-mapping`, `guides/evm/precompiles/balance-transfer`.
- BitcodeX `sdk/bitcodex_sdk_eth` (EIP-1193 provider via viem) and chain configs.
- How the H160 maps to its SS58 mirror (confirm formula in subtensor source or via the precompile).

## How to build
1. Add Subtensor EVM chains to the ETH SDK chain list (local config, not the Keplr registry).
2. Show the EVM address and its SS58 mirror in the wallet; "Move TAO to EVM" = native transfer to the mirror.
3. Demo: deploy or call a simple contract from the demo app.

## Acceptance checks
- [ ] Same login → EVM address; `eth_getBalance` shows funds after moving TAO to the mirror.
- [ ] A contract call signs through the BitcodeX modal and succeeds on localnet EVM.
