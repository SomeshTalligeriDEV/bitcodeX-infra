# Continue here (M2 Mac, more storage)

Repo: https://github.com/SomeshTalligeriDEV/bitcodeX-infra (main, pushed)

## Setup
```bash
git clone https://github.com/SomeshTalligeriDEV/bitcodeX-infra.git
cd bitcodeX-infra
node --version   # need v22+
corepack enable
rustup install
cargo install wasm-pack
yarn install --immutable
```

## What's done
- Initial BitcodeX codebase committed (`032e7d6`).
- `.gitignore` updated to exclude `scratch/` (throwaway probe scripts, not app code).
- Confirmed FROST wasm_bindgen exports exist as expected:
  `cli_keygen_seed_ed25519` (crypto/teddsa/frost_ed25519_cosmos_compat_wasm/wasm/src/keygen.rs:139),
  `cli_sign_round1_ed25519`, `cli_sign_round2_ed25519`, `cli_aggregate_ed25519` (sign.rs:177/186/208).

## What's NOT done yet (blocked on old laptop, disk full)
- Never ran a Subtensor localnet. Note: `RaoFoundation/subtensor`'s
  `docker-compose.localnet.yml` does **not** pull a prebuilt image — it
  builds `ghcr.io/raofoundation/subtensor:latest-local` from source
  (`target: subtensor-local`), i.e. `docker compose -f docker-compose.localnet.yml up --build`.
  That's a real Rust/Substrate compile, expect 20-40+ min and several GB, not a quick pull.
- `scratch/probe/package.json` (gitignored, local only, never pushed) was scaffolded
  with `@polkadot/api@17.0.2`, `@polkadot/keyring@14.0.3`, `@polkadot/util-crypto@14.0.3`
  but `npm install` never completed (disk full).
- No probe steps (3a-3e) run, no localnet started, no tx hashes exist.
- Nothing recorded yet in `bitcodex-docs/00-research.md` — there's nothing verified to put there.

## Next steps on this machine
1. Re-create `scratch/probe/` (gitignored, won't be in the clone) with the same
   polkadot.js deps above, `npm install`.
2. `colima start` (or Docker Desktop) then
   `docker compose -f docker-compose.localnet.yml up --build` in the subtensor repo
   — budget real time/disk for the Rust build.
3. Resume the FROST keygen/sign probe (3a-3e) against the running localnet using the
   confirmed wasm exports above.
4. Follow standard build order once touching the main repo:
   `yarn ci build_cs && yarn ci build_frost && yarn ci build_pkgs && yarn ci build_sdk && yarn ci typecheck`.
