# X09 · App and agent permissions via Subtensor proxies (Privy "signers + policies")

**Tier:** BUILD (Staking, SmallTransfer) · PREVIEW (off-chain rules) · **Phase:** 5

## Goal
A user lets an app or AI agent act for them within limits the chain enforces, without sharing their key: "Allow Bitcode Agent to stake for me" → agent stakes on its own; user can revoke any time.

## Research first
- Docs `guides/proxies` (types, deposits, delays, announcements), `concepts/advanced`.
- Metadata: `proxy.addProxy`, `removeProxy`, `proxy`, `announce`, `rejectAnnouncement`, `ProxyType` enum names on Subtensor.
- Privy docs "Additional signers", "Policies" (UX reference only).

## How to build
1. App registers an **app key** (sr25519, kept on the app's server; BitcodeX never sees its secret) in the dev dashboard (X11).
2. SDK `requestPermission({ proxyType: 'Staking' | 'SmallTransfer' | 'Registration', delayBlocks })` → iframe modal explains in plain English what the app can and cannot do, and the deposit (0.06 + 0.033 TAO) → user signs `proxy.addProxy(appKey, type, delay)`.
3. Server SDK (X10) helper `actAs(userAddress, call)` builds `proxy.proxy(userAddress, type, call)` signed by the app key.
4. User dashboard lists proxies (chain query) with Revoke (`removeProxy`).
5. PREVIEW: off-chain rules in the iframe (daily limit, allowed netuids) shown as "coming with policies".

## Acceptance checks
- [ ] Grant Staking proxy → demo agent stakes 1 TAO for the user with no user popup → stake visible on the user. (Chain side + agent route passed 2026-10-29, tx `0x6425465f…`; grant from a BitcodeX login via the popup: pending.)
- [x] Same agent tries a transfer → chain rejects (`CallFiltered`). (`tests/permissions.localnet.test.ts`)
- [x] SmallTransfer: 0.4 TAO works, 0.6 TAO fails (`CallFiltered`; the limit is `value < 0.5 TAO`, read from the chain).
- [x] Revoke → next agent action fails (`NotProxy`); deposit refunded exactly. (Revoke button in the demo/dashboard: pending browser check.)
