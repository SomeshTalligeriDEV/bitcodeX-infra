# 04 · Privy feature parity map

Source: Privy docs index (https://docs.privy.io/llms.txt, read 28 Oct 2026). "BitcodeX has it" = already in the BitcodeX code for other chains.

Tiers: **BUILD** (works live), **PREVIEW** (real screen, one simulated action, labelled), **ROADMAP** (slide), **OUT** (not for Bittensor or needs money/licences).

## Authentication and users

| Privy feature | BitcodeX | BitcodeX has it | Tier | Spec |
|---|---|---|---|---|
| Email login (OTP) | same | yes | BUILD | X04 |
| Google, GitHub, X, Discord, Telegram OAuth | same, our own client IDs | yes | BUILD (Google + email first) | X04 |
| Apple, Farcaster, other OAuth | | no | ROADMAP | |
| SMS / WhatsApp login | | no | OUT (paid SMS) | |
| Passkey login | WebAuthn passkey as a login method | no | BUILD (stretch) | X04 |
| Wallet login (connect external wallet) | "Continue with Talisman / SubWallet / Polkadot.js" + Sign-in-with-Bittensor message | no | BUILD | X04 |
| Guest accounts | anonymous session, upgrade later | no | ROADMAP | |
| Bring your own auth (JWT) | accept customer JWT (JWKS) | partial (auth0) | PREVIEW | X10 |
| Access / identity tokens, sessions, logout | same | yes | BUILD | X04 |
| Prebuilt login modal + whitelabel/theme | BitcodeX modal, theme, logo per app | yes | BUILD | X04, X11 |
| Link / unlink accounts | link Google + email + wallet to one user | partial | PREVIEW | X04 |
| User object, custom metadata | same | partial | BUILD (read), PREVIEW (metadata) | X10 |
| Query, delete, freeze users; allowlist/denylist | dev dashboard | partial (admin web) | PREVIEW | X11 |
| MFA (TOTP, passkey, SMS) | TOTP + passkey before signing over a limit | no | ROADMAP (PREVIEW screen) | X12 |
| CAPTCHA, bot mitigation | | no | ROADMAP | |
| Webhooks (user created, tx sent) | | no | ROADMAP | |
| KYC / KYB | | no | OUT | |

## Wallets

| Privy feature | BitcodeX | BitcodeX has it | Tier | Spec |
|---|---|---|---|---|
| Embedded wallet auto-created on login | Bittensor coldkey (FROST Ed25519) on first login | yes (Solana) | BUILD | X02 |
| Non-custodial key split + recovery | 2-of-2 + KSN backup | yes | BUILD | X02 |
| Signing UI with readable summary | Bittensor call decoder + fee | yes (per chain) | BUILD | X03 |
| Send native token | send TAO | yes | BUILD | X05 |
| Sign message | Sign-in-with-Bittensor + raw sign | yes | BUILD | X05 |
| Export private key | export Ed25519 seed (re-auth) | yes | BUILD | X07 |
| Import wallet | | partial | ROADMAP | |
| Balances and tx history | TAO + alpha per subnet, history from chain | partial | BUILD | X05, X06 |
| Multiple chains | Subtensor native + Subtensor EVM | yes | PREVIEW (EVM) | X13 |
| HD wallets / multiple wallets per user | several coldkeys per user | no | ROADMAP | |
| Pregenerate wallets for an email | | no | ROADMAP | |
| Server wallets / agentic wallets | app key + on-chain proxy | no | BUILD | X09 |
| Session signers, owners, authorization keys | proxy types + delays | no | BUILD (Staking, SmallTransfer) | X09 |
| Policies (amount limits, allowlists, time-bound) | on-chain proxy type (+ off-chain checks in iframe) | no | BUILD (on-chain types), PREVIEW (off-chain rules) | X09 |
| Key quorums / manual approvals | Subtensor multisig | no | ROADMAP | |
| Distributed key generation (no dealer) | **FROST DKG** between iframe and server, so the full key never exists, even at creation (today: dealer keygen, seed zeroed after split; see 07-security.md) | no | ROADMAP | |
| Smart wallets, gas sponsorship | | no | OUT (no AA on Subtensor native) | |
| Secure enclaves (TEE) | | no | OUT | |

## Money movement

| Privy feature | BitcodeX | Tier | Spec |
|---|---|---|---|
| Funding: faucet, copy address, QR | localnet faucet, testnet faucet link, QR | BUILD | X14 |
| Fiat on/off ramp, cards, bank payouts | | OUT | |
| Swap tokens | TAO ↔ subnet alpha via stake/unstake pools | BUILD | X05 |
| Earn | stake to validators, show yield | BUILD (stake), PREVIEW (yield) | X05, X06 |
| Bridging | link to Astrid Bridge (mainnet) | ROADMAP | |
| x402 / machine payments | via Bitcode credit contract | ROADMAP | |

## Developer platform

| Privy feature | BitcodeX | Tier | Spec |
|---|---|---|---|
| React SDK + hooks | `@bitcodex/sdk-react` | BUILD | X02 |
| Vanilla JS SDK | `@bitcodex/sdk-bittensor` | BUILD | X02 |
| Works with existing dApp libs (wagmi etc.) | `injectedWeb3` so `@polkadot/extension-dapp` apps see BitcodeX | BUILD | X02 |
| React Native, Swift, Android, Flutter, Unity | BitcodeX has RN core | ROADMAP | |
| Server SDK (Node) + REST API | verify token, get user, list wallets | BUILD (Node minimal) | X10 |
| Python, Go, Rust, Java, Ruby SDKs | Python helper for subnets | ROADMAP | |
| Dashboard: apps, API keys, allowed origins, login methods, appearance | dev dashboard | BUILD (apps, keys, origins), PREVIEW (rest) | X11 |
| Teammate roles, SSO, dashboard MFA | | ROADMAP | |
| Activity logs | | ROADMAP | |
| Demo site (demo.privy.io) | demo.bitcodex | BUILD | X15 |

## Bittensor-only extras (things Privy cannot do)

| Feature | Tier | Spec |
|---|---|---|
| Register a hotkey on a subnet from the wallet | BUILD | X08 |
| Hotkey address book (miners/validators the user owns) | BUILD | X08 |
| Stake to a validator on a subnet, see alpha | BUILD | X05 |
| "Sign in with Bittensor" message standard for apps | BUILD | X05 |
| Coldkey swap and hotkey swap screens | PREVIEW | X07 |
| Bitcode Studio login and launch-signing | BUILD | X16 |
| Connect from btcli via extension bridge | ROADMAP | |
