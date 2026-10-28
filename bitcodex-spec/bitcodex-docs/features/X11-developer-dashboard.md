# X11 · Developer dashboard

**Tier:** BUILD (apps, API keys, allowed origins) · PREVIEW (login methods, appearance, users) · **Phase:** 5

## Goal
Developers create an app, get an API key, set allowed origins and login methods, and style the modal, like the Privy dashboard.

## Research first
`apps/customer_dashboard/**`, `backend/ct_dashboard_api/**`, `apps/bitcodex_admin_web/**`.

## How to build
1. Rebranded customer dashboard: create app → API key, app id, app secret (shown once).
2. Allowed origins list (enforced by the iframe, X03).
3. Login methods toggles and order; appearance (logo upload to MinIO, accent colour, light/dark) used by X04.
4. Users table (PREVIEW): id, linked accounts, address, created, last login.
5. Network setting per app: localnet or testnet.

## Acceptance checks
- [ ] New app's key works in the demo app; a request from an origin not in the list is refused.
- [ ] Turning Google off removes it from that app's modal.
- [ ] Logo and colour change shows in the modal.
