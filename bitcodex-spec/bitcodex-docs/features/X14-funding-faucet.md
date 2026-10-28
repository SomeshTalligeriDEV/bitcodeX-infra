# X14 · Funding: faucet, address, QR

**Tier:** BUILD · **Phase:** 2 · **Owner:** Builder 2

## Goal
A new user has test TAO in one click, like Privy's "fund wallet".

## Research first
Localnet dev accounts (Alice is pre-funded); official testnet faucet availability (check docs/Discord; do not script against a faucet that forbids it).

## How to build
1. `faucet` service (tiny Express route in bitcodex_api, localnet only): sends 1,000 TAO from Alice to an address; rate limit 1 per address per minute. Alice's dev key lives only in this local service's env.
2. Testnet: show address + QR + link to the official faucet or instructions.
3. Wallet widget "Get test TAO" and deposit modal QR.

## Acceptance checks
- [ ] New user → Get test TAO → balance 1,000 TAO within 2 blocks.
- [ ] Faucet route refuses when the chain is not localnet.
