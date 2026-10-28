# X15 · Demo app (BitcodeX version of demo.privy.io)

**Tier:** BUILD · **Phase:** 4 · **Owner:** Builder 1

## Goal
A polished public demo where anyone can log in, get a Bittensor wallet and try every action, with the SDK code shown next to each widget.

## Research first
`apps/demo_web/src/**` (left_bar, control_panel, console_panel, preview_panel, widgets), https://demo.privy.io (layout and flow reference), `bitcodex-docs/08-demo.md`.

## How to build
1. Rebrand demo_web; default ecosystem Bittensor; hide other chains behind "More chains".
2. Widgets listed in 08-demo.md (login, user, wallet, send, stake, register hotkey, sign message, permissions, export, code panel).
3. Console panel logs every SDK call and result (no secrets).
4. Theme controls that restyle the login modal live.
5. Public link via `cloudflared tunnel` for the demo day (update OAuth redirect URIs).

## Acceptance checks
- [ ] A new person completes login → faucet → send → stake → sign message in under 2 minutes without help.
- [ ] Every widget shows working code that matches the SDK.
- [ ] Works on a phone browser.
