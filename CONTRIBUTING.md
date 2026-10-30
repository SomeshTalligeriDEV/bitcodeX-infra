# Contributing to BitcodeX

Thank you for helping. BitcodeX is embedded-wallet infrastructure for Bittensor, so changes
touch money and keys. Small, well-tested pull requests are easiest to review.

## Ground rules

- **Testnet and local chains only.** Mainnet stays disabled until an external audit. Never
  add a code path that signs for mainnet.
- **No simulated data.** Everything shown to a user is read from the chain or the API. If a
  feature is not real yet, hide it or label it "Coming soon" or "Preview".
- **Never log secrets:** key shares, seeds, mnemonics, signature nonces, JWTs, OAuth tokens.
  `scripts/check_secret_logs.sh` runs in CI.
- **Hotkeys are not coldkeys.** Do not generate hotkeys in the threshold system.
- **Every signature needs a visible confirmation** in the wallet frame.
- No secrets in code, issues or chat. Use `.env` files (they are git-ignored).

## Set up

Requirements: Node 22+, Yarn 4 (`corepack enable`), Rust (see `rust-toolchain`), `wasm-pack`,
Docker (local database and test chain).

```bash
corepack enable
yarn install --immutable
yarn ci build_cs && yarn ci build_frost     # WASM crypto
yarn ci build_pkgs && yarn ci build_sdk     # packages and SDKs
scripts/dev-up.sh                           # local stack (add --fast for production builds)
```

## Before you open a pull request

```bash
yarn ci typecheck                  # TypeScript across all packages
yarn exec biome check --write .    # lint and format
cargo check --workspace            # if you touched Rust
```

CI runs the same checks and must pass.

## Commits and pull requests

Use `<scope>: <description>`: lowercase, imperative, English. The scope is the package or area.

```
demo_web: fix load listener leak in useThemeSyncToIframe
sdk: add proxy quote helper
project: fix biome lint and format errors
```

Use the pull request template. Write a Summary (what changed, why, the impact) and link the
issue, for example `Closes #123`. The PR title follows the same format as commits.

If you change an API route, update both the Zod schema (with `.openapi()`) and the
`registry.registerPath()` next to the handler.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately to the
maintainers with steps to reproduce.

## Licence

By contributing you agree that your contribution is licensed under the
[Apache License 2.0](LICENSE).
