# X16 · Bitcode Studio integration

**Status: DEFERRED (2026-10-29).** Bitcode Studio is being renamed **Tensor Studio** and is not built yet; its spec kit (`F03-wallet-core.md`, the `Signer` interface) is not available. Resume when Tensor Studio exists.

**Tier:** BUILD · **Phase:** 4 · **Owner:** Builder 2

## Goal
Bitcode Studio uses BitcodeX as its login and wallet: "Sign in with BitcodeX", and SubCreate's subnet launch, staking and hotkey registration are signed through the BitcodeX modal.

## Research first
`bitcode-spec/docs/features/F03-wallet-core.md` (from the Bitcode Studio kit) (the `Signer` interface: `mnemonic | extension | social`), F04/F05 (launch flow), X02 SDK.

## How to build
1. Implement Bitcode's `Signer` kind `social` with `@bitcodex/sdk-bittensor`.
2. Studio login screen: "Continue with Google (BitcodeX)", "Create with 12 words", "Connect existing wallet".
3. Launch flow (`registerNetwork`, `burnedRegister`, stake) uses the BitcodeX signer on localnet.

## Acceptance checks
- [ ] Log in to Studio with Google → same address as in the BitcodeX demo app.
- [ ] Launch a subnet on localnet from Studio signed by BitcodeX.
