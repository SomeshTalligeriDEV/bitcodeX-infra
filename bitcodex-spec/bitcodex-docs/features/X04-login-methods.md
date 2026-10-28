# X04 · Login methods (Privy-style modal)

**Tier:** BUILD (email, Google, external wallet) · BUILD stretch (passkey) · PREVIEW (account linking) · **Owner:** Builder 2

## Goal
One login modal with email OTP, Google, GitHub, X, Discord, Telegram, passkey and "Connect existing wallet", themed per app. Whatever the method, the user ends up with the same BitcodeX user and Bittensor wallet.

## Research first
- Iframe routes `email`, `google`, `github`, `x`, `discord`, `telegram`, `app/auth0`, `config/oauth.ts`, `sdk/bitcodex_sdk_core/src/ui/signin_modal`, `methods/open_sign_in_modal.ts`, backend `social_login_v2`, KSN `auth/`.
- How KSNs verify each token type (they must accept our providers too).
- Privy docs: login methods, UI components, whitelabel (behaviour only).
- WebAuthn: `@simplewebauthn/browser` + `@simplewebauthn/server` (pin versions).
- `@polkadot/extension-dapp` (`web3Enable`, `web3Accounts`, `web3FromSource`).

## How to build
1. Email + Google first (exist in BitcodeX; switch to our client IDs). Then GitHub. X/Discord/Telegram only if their free developer apps are quick to set up.
2. **External wallet login:** "Continue with Talisman/SubWallet/Polkadot.js" → sign a Sign-in-with-Bittensor message (domain, address, nonce, time) → backend verifies with `signatureVerify` → issues a BitcodeX session. This user has no MPC wallet; their extension signs.
3. **Passkey (stretch):** register a passkey after first social login; later "Sign in with passkey" → backend verifies assertion → issues the same session. KSNs must accept a BitcodeX-issued token for fragment release (design this with the agent; do not weaken KSN checks).
4. Modal theme: logo, accent colour, light/dark, method order, from the app config (X11) with defaults.
5. Linked accounts list (PREVIEW): show all methods linked to the user.

## Acceptance checks
- [ ] Email OTP, Google and GitHub each create a user and wallet; logging in again gives the same address.
- [ ] Talisman (or Polkadot.js extension) login works and the session shows the extension address.
- [ ] (Stretch) Passkey login on Chrome/Safari returns the same wallet as the user's Google login.
- [ ] Wrong OTP, expired OTP and cancelled OAuth show clear errors.
- [ ] Theme changes in the demo app apply to the modal live.
