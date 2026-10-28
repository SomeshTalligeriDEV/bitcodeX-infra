# Kickoff prompts for Claude Code (paste in order)

Setup: clone the `bitcodex` repo, unzip this kit in the repo root (our `CLAUDE.md` replaces BitcodeX's one-line `CLAUDE.md` and still imports `AGENTS.md`; the `bitcodex-docs/` folder sits next to it). Open Claude Code in the repo root.

---

## Prompt 1 · Understand the whole codebase (no code changes)

```
Read CLAUDE.md and AGENTS.md fully, then bitcodex-docs/README.md and bitcodex-docs/01-bitcodex-codebase-map.md.

Your job in this session is to understand the BitcodeX codebase completely. Do not change any code.

1. Map every workspace in package.json and Cargo.toml: what it does, what it depends on, who depends on it.
2. Trace these flows end to end through the real code, file by file, and write each as a numbered
   sequence (file:function -> file:function), including every HTTP route and postMessage type:
   a. Google sign-in -> Ed25519 keygen (keygen_ed25519) -> server share stored -> user share split by SSS
      -> fragments registered on key share nodes (/keyshare/v2/register/ed25519).
   b. Returning user sign-in -> fragments fetched from key share nodes -> client share rebuilt once in the iframe.
   c. SVM signTransaction from demo_web -> bitcodex_sdk_svm -> postMessage -> bitcodex_attached modal
      -> FROST round1/round2 with /tss/v2/sign_ed25519/* -> aggregate -> signature back to the app.
   d. Key export (window_msgs/export_private_key.ts, /tss/v2/export_shares).
   e. Email OTP login and each OAuth provider (google, github, x, discord, telegram, auth0).
3. List every place that is Solana/SVM-specific (types, msg types, modal variants, tx parsers, chain infos,
   wallet-standard) so we know exactly what a new "bittensor" ecosystem must mirror.
4. List every hard-coded value we must replace: OAuth client IDs, URLs, domains, analytics keys (Amplitude),
   S3 buckets, email sender, logos, the "service shutdown" modal.
5. List every external service each backend needs (Postgres, S3, SMTP, Elasticsearch) and which are optional.
6. Build and run it locally following documentation/install_and_run.md and the self-hosting guide,
   with Postgres in Docker, MinIO for S3 and Mailpit for email. Get demo_web signing a Solana devnet
   message. Record every command and every error.

Write all findings into bitcodex-docs/01-bitcodex-codebase-map.md under "Agent findings (dated)", keeping
what is already there and correcting anything wrong. End with: open questions, risks, and anything in
our specs that the code contradicts. Then stop and wait for me.
```

## Prompt 2 · Learn how Bittensor wallets work, and prove Ed25519 (probe only)

```
Read bitcodex-docs/02-bittensor-wallets.md and bitcodex-docs/00-research.md.

1. Open every official page listed in 00-research.md "Official sources" (use the raw .md URLs).
   For each, write 3-6 lines of facts into 02-bittensor-wallets.md under "Verified from docs (dated)".
2. In RaoFoundation/subtensor, confirm: the Signature type, AccountId type, SS58 prefix, the signed
   extensions (TxExtension / SignedExtra) list, existential deposit, and how fees are computed. Quote file and line.
3. Start localnet (docker) and run probes in a scratch folder (not in the repo packages):
   a. With @polkadot/api + @polkadot/keyring: create an ed25519 keypair, transfer 10 TAO from Alice to it,
      then transfer 1 TAO back FROM the ed25519 account. Print both tx hashes and balances.
   b. Same as (a) but sign with BitcodeX's FROST ed25519 WASM (crypto/teddsa) using a 2-of-2 key made with
      cli_keygen_seed_ed25519: build the signer payload with @polkadot/api, sign the exact bytes
      (blake2_256 first if the payload is longer than 256 bytes), wrap as MultiSignature Ed25519
      (0x00 prefix), submit. This proves BitcodeX works.
   c. From the ed25519 account: add_stake to a localnet validator hotkey, then remove_stake.
   d. From the ed25519 account: burned_register a fresh sr25519 hotkey on a localnet subnet.
   e. From the ed25519 account: add_proxy (type Staking) for another key, then use the proxy to add_stake.
4. Record every command, output and tx hash in 00-research.md "Verified findings".
If any probe fails, stop, show me the exact error, and propose options. Do not continue to Prompt 3 until
probe 3b passes.
```

## Prompt 3 · Rebrand to BitcodeX

```
Read bitcodex-docs/05-rebrand.md. Do Stage A (visible rebrand) only.
Make a plan listing every file you will change, then wait for my OK.
After OK: make the changes, run the full build (yarn ci setup --skip-rust), start all services,
and show me demo_web, bitcodex_attached and user_dashboard screenshots with BitcodeX branding and
Solana devnet signing still working. Commit with scope "project".
```

## Prompt 4 · Each feature (repeat for X02 to X16 in the order in 06-build-order.md)

```
Next feature: bitcodex-docs/features/<FILE>.md.
Read it, the docs it links, and the BitcodeX files listed in its "Mirror these files" section.
Research anything not yet verified and add findings to 00-research.md.
Give me a 5-12 step plan with the exact files you will create or change. Wait for my OK.
Then build it, run every acceptance check on a fresh localnet from the demo app UI, show me the results
(screenshots, tx hashes, test output), confirm no key material in logs, add the step to 08-demo.md, and commit.
```

## When something breaks

```
Stop. Show me the exact error, the command or click that caused it, and the relevant log lines.
Find the cause in the code (ours, BitcodeX's, or polkadot.js) and the official docs before changing anything.
Propose the smallest fix and why.
```

## End of each day

```
Status report: which acceptance checks pass, which fail and why, what is left in 06-build-order.md,
and what should move from BUILD to PREVIEW to protect the demo.
```

## Security review (run before the demo)

```
Read bitcodex-docs/07-security.md. Review every change we made against each rule and threat listed.
Grep the repo and the running services' logs for seeds, shares, mnemonics, JWTs and private keys.
Check that mainnet is disabled in every code path. Report findings ranked by severity. Fix only after I approve.
```
