# X08 · Hotkeys: address book and subnet registration

**Tier:** BUILD · **Phase:** 3 · **Owner:** Builder 2

## Goal
A BitcodeX coldkey can own and register miner/validator hotkeys without the hotkey ever touching BitcodeX servers.

## Research first
- Docs `concepts/wallets` (hotkey role, security tiers), `guides/mining`, `guides/mining/burn`, `guides/mining/collateral`.
- Metadata: `subtensorModule.burnedRegister` args, burn cost query, `owner` / `ownedHotkeys` storage, how a hotkey becomes associated with a coldkey.

## How to build
1. "My hotkeys": add by address (paste or QR), label, show subnets and UIDs (chain query).
2. Register: choose netuid → show current burn → `burnedRegister(netuid, hotkey)` signed by the coldkey through X03 modal.
3. Helper text for creating a hotkey on the node: `btcli wallet new-hotkey` (verify v11 command) or Bitcode BitNode (it creates the hotkey in the container and shows only its address).
4. Never offer "create hotkey here" in the BitcodeX UI (hard rule).

## Acceptance checks
- [ ] Register a fresh sr25519 hotkey on a localnet subnet from a BitcodeX coldkey; UID appears.
- [ ] The hotkey shows as owned by the BitcodeX coldkey in chain storage.
- [ ] Burn cost shown equals the amount charged.
