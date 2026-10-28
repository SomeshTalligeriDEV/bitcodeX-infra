# 07 · Security model and rules

BitcodeX holds people's money. Until an external audit it runs on **localnet and testnet only**. Say this on the demo slide.

## What protects the coldkey

- 2-of-2 threshold: an attacker needs both the browser share (P0) and the server share (P1). Neither party alone can sign.
- Recovery: P0 is SSS-split across key share nodes; each node releases its fragment only to a valid OAuth/email token for that user.
- Signing happens only in the iframe on its own origin; the host app never sees shares.

## Threats and what we do

| Threat | Mitigation | Check |
|---|---|---|
| Malicious host app tricks user into signing | decoded confirm modal shows pallet.method, amounts in TAO, destination, netuid, fee, requesting origin; unknown calls flagged red | X03 tests with a fake transfer hidden in `utility.batch` |
| Host app reads keys | iframe origin isolation; postMessage validates `event.origin` against the app's allowed origins | X11 allowed origins; e2e test from a non-allowed origin fails |
| Server breach | P1 encrypted at rest (`ENCRYPTION_SECRET`); P1 alone cannot sign | verify encryption in DB |
| Stolen OAuth token | KSN fragments + server cooperation still needed; short JWT expiry | |
| Logs leak secrets | never log shares, seeds, nonces, JWTs, OAuth tokens; CI grep | security prompt in KICKOFF_PROMPTS.md |
| Replay / wrong chain | signer payload includes genesis hash, spec version, mortal era; iframe shows network badge; refuse mainnet when disabled | X03 |
| Lost user share on device | sign in again → fragments from KSNs | X07 |
| Compromised app/agent key | proxies are typed (Staking, SmallTransfer) and revocable; show active proxies in user dashboard | X09 |
| Supply chain | pin all versions, `yarn install --immutable`, no new deps without approval | |
| FROST nonce reuse | use BitcodeX's WASM as-is; never cache or reuse round-1 nonces | code review |

## Keygen seed lifetime (accepted risk until FROST DKG)

Decision (28 Oct 2026): keep BitcodeX's **dealer keygen** for now. At wallet creation the iframe briefly holds the full Ed25519 seed and derives the full scalar, then FROST-splits it into P0 (client) and P1 (server) and SSS-splits the seed (2-of-2 server/user, then the user part t-of-n across KSNs). This is the one moment the complete key exists in one place outside export, and it contradicts the "never in one place" rule. It is accepted as a known risk with these controls:

- The seed is created by `generateSeed()` in `embed/bitcodex_attached/src/crypto/keygen_ed25519.ts` and lives only in memory inside `runEd25519KeygenAndSplit`.
- It is **never logged, never stored** (not in Zustand/localStorage, not in IndexedDB) **and never returned**: `Ed25519KeygenSplitResult` carries only shares.
- **Zeroed right after splitting:** `seedBytes.fill(0)` and the WASM input copy `.fill(0)` run in a `finally` block, on success and on every error path. `runTeddsaKeygenSeed` (`crypto/teddsa/teddsa_hooks/src/keygen.ts`) zeroes its own temporary copies the same way.
- Keygen runs only in the iframe origin, never in the host app and never on the server.

Residual risk, stated honestly:
- JavaScript cannot guarantee erasure: the engine may have copied the buffer (GC, JIT, structured clone), and the number arrays passed into WASM are copied by `serde_wasm_bindgen`.
- The Rust/WASM side (`cli_keygen_seed_ed25519`, `seed_sss_split`) takes the seed and scalar by value and does not zeroize. Fixing that is a `crypto/` Rust change, which needs a separate decision.
- Malicious code running in the iframe origin during keygen (XSS, a compromised dependency) could read the seed.

**Fix (ROADMAP):** replace dealer keygen with **distributed keygen (FROST DKG)** between iframe and server, so that no party ever holds the full scalar. Export (X07) would then need a different design (e.g. export signing shares, or no seed export).

Check: `git grep -n "seed" embed/bitcodex_attached/src/crypto/keygen_ed25519.ts` shows no logging; a code review confirms `fill(0)` on every path.

## Hard rules (also in CLAUDE.md)

1. Mainnet disabled until audit.
2. No code combines P0 and P1, except user-initiated export inside the iframe after re-auth.
3. Hotkeys are created on node machines; BitcodeX stores only addresses.
4. Every signature has a visible confirmation (except proxies the user explicitly granted, which sign with the app key, not the user's shares).
5. No secrets in git or chat; `.env.example` only.
6. Keep BitcodeX's encryption and token checks; do not weaken any check to make a demo work.
