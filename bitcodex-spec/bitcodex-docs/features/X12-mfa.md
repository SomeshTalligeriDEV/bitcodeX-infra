# X12 · MFA before signing

**Tier:** PREVIEW · **Phase:** 6

## Goal
Optional second factor (TOTP app or passkey) required before signing transfers above a user-set amount, like Privy wallet MFA.

## Research first
Privy MFA docs (behaviour); `otplib` or similar for TOTP (pin); `@simplewebauthn/*` for passkeys; where in BitcodeX's sign flow a server-side check can block round 2 (`/tss/v2/sign_ed25519/round2`).

## How to build
1. Enrol TOTP or passkey in the user dashboard.
2. Server enforces: round 2 refused unless a fresh MFA proof is attached when amount > threshold (amount comes from the decoded payload server-side, not from the client's claim).
3. Modal asks for the code before signing.

## Acceptance checks
- [ ] Transfer above threshold without MFA fails at the server; with a valid code succeeds.
- [ ] Below threshold, no prompt.
