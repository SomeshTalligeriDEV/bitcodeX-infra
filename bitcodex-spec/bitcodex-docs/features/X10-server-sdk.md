# X10 · Server SDK and REST (Node)

**Tier:** BUILD (minimal) · **Phase:** 5

## Goal
App backends can trust a BitcodeX login and look up the user's wallet, like Privy's Node SDK.

## Research first
BitcodeX JWT issuance and verification in `backend/bitcodex_api/server/src/middleware`, `openapi/`, customer API keys in `ct_dashboard_api`.

## How to build
1. Package `@bitcodex/server` (Node): `verifyAccessToken(token)` (JWKS or shared secret per app; prefer asymmetric keys, add a JWKS endpoint), `getUser(userId)`, `getWallets(userId)`, `verifySiwb(message, signature)`, `actAs(...)` (X09).
2. REST routes with Zod + OpenAPI: `GET /v1/users/:id`, `GET /v1/users/:id/wallets`, auth with app secret.
3. PREVIEW: "bring your own auth" (accept a customer JWT via configured JWKS) as Privy does.

## Acceptance checks
- [ ] Sample Express server verifies a token from the demo app and returns the user's Bittensor address.
- [ ] Wrong app secret → 401; expired token → 401.
- [ ] OpenAPI JSON lists the new routes.
