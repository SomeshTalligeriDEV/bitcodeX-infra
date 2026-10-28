# BitcodeX: Privy-style embedded wallets for Bittensor

BitcodeX is an embedded wallet stack, extended so that any Bittensor app can do what Privy (https://www.privy.io) does for Ethereum and Solana:

- users sign in with email, Google, GitHub, X, Discord, Telegram or a passkey,
- a real Bittensor wallet (coldkey, SS58 address starting with `5`) is created for them with no seed phrase and no extension,
- they send TAO, stake, register hotkeys and sign messages through a clean confirmation modal,
- developers add it with one SDK (`@bitcodex/sdk-bittensor`) and manage apps in a dashboard,
- apps and agents get scoped, on-chain-enforced permissions through Subtensor **proxies** (Bittensor's native version of Privy's "signers and policies").

It is also the login layer of **Bitcode Studio** (see the separate `bitcode-spec` kit).

## Why BitcodeX works for Bittensor (checked 28 Oct 2026)

- BitcodeX already has **threshold Ed25519 (FROST, 2-of-2: browser + server)** for Solana, with the private key never rebuilt.
- Subtensor accepts Ed25519 accounts: its runtime uses `Signature = MultiSignature` (`RaoFoundation/subtensor`, `common/src/lib.rs`, commit 8d7f421, 27 Oct 2026), and the official extension-signing guide says accounts "must be sr25519 or ed25519".
- So a BitcodeX coldkey = BitcodeX's Ed25519 threshold key, shown as an SS58 address. **This must still be proven by a real transfer on localnet on day 1** (see `00-research.md`).

## Caveat you must know

BitcodeX's hosted service shut down on **1 June 2026** (notice in `apps/user_dashboard`), and the last commit is **14 May 2026**. The code is open and complete, but nobody upstream maintains it. We own this codebase: pin every dependency, read code before trusting it.

## What is in this kit

| File | What it is |
|---|---|
| `../CLAUDE.md` | Rules for the coding agent. Goes in the repo root. |
| `KICKOFF_PROMPTS.md` | The prompts to paste, in order: understand the codebase, learn Bittensor, rebrand, build each feature. |
| `00-research.md` | Official sources and the day-1 probes (including the Ed25519 transfer test). |
| `01-bitcodex-codebase-map.md` | What every part of BitcodeX does and which files to copy for Bittensor. |
| `02-bittensor-wallets.md` | How Bittensor wallets work: coldkey, hotkey, signing, proxies, swaps, EVM. |
| `03-architecture.md` | The BitcodeX design: key model, services, SDK, data flow. |
| `04-privy-parity.md` | Every Privy feature mapped to BitcodeX, with tier (Build / Preview / Roadmap / Out). |
| `05-rebrand.md` | How to rename BitcodeX to BitcodeX safely, and what the licence requires. |
| `06-build-order.md` | Phases with checks, and who does what. |
| `07-security.md` | Threat model and hard safety rules. |
| `08-demo.md` | The demo app (like demo.privy.io) and the 3-minute demo script. |
| `features/X01…X16` | One spec per feature with research steps, build steps and acceptance checks. |

## How to start

1. Set up the `bitcodex` repo in your account (keep the git history; it is required for the licence trail).
2. Unzip this kit into the repo root: `CLAUDE.md` replaces BitcodeX's one-line `CLAUDE.md` (ours still imports BitcodeX's `AGENTS.md`), and the `bitcodex-docs/` folder sits next to it.
3. Open Claude Code in the repo and paste **Prompt 1** from `KICKOFF_PROMPTS.md`. Go prompt by prompt; do not skip the research prompts.
