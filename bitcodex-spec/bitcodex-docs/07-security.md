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

## Hard rules (also in CLAUDE.md)

1. Mainnet disabled until audit.
2. No code combines P0 and P1, except user-initiated export inside the iframe after re-auth.
3. Hotkeys are created on node machines; BitcodeX stores only addresses.
4. Every signature has a visible confirmation (except proxies the user explicitly granted, which sign with the app key, not the user's shares).
5. No secrets in git or chat; `.env.example` only.
6. Keep BitcodeX's encryption and token checks; do not weaken any check to make a demo work.
