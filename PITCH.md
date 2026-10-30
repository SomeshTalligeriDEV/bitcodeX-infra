# BitcodeX: pitch and demo guide

> **One line:** Embedded wallets for Bittensor. Log in with Google, get a real wallet, approve
> every action in a popup. No extension, no seed phrase, and no single party can move your funds.

Live: https://bitcodex-demo.vercel.app · Docs: https://bitcodex-demo.vercel.app/docs ·
Everything in one file: [BITCODEX.md](BITCODEX.md)

## The 30-second pitch

Bittensor turns machine intelligence into a market, paid in TAO. Everything on it starts with a
wallet, and today that means a browser extension or a command line, and a seed phrase. Most people
who would use a Bittensor-powered app never get past that step.

**BitcodeX removes it.** A user signs in with Google and gets a real Bittensor account in
seconds. Their key is split between their browser and our servers, so nobody, including us, can
move their money alone. Developers add it with a few lines of React.

## Problem → solution → proof

| | |
|---|---|
| **Problem** | Wallet setup blocks new users. Apps that want to hold, stake or send TAO for users have no easy way to give each one a wallet. |
| **Solution** | Embedded wallets: social login, a threshold key (FROST Ed25519, 2-of-2), a readable approval popup, and on-chain permissions for apps and AI agents. |
| **Why Bittensor** | Its coldkey/hotkey split and built-in proxies fit this model: an agent can act for a user within limits the *chain* enforces, without ever holding the key. |
| **Proof it is real** | 68 tests against a live local chain (transfers, staking, hotkey registration, permissions), a live site reading the real testnet, four installable packages, docs, one-command self-host, and a Render deployment. |

## 2-minute demo script

1. **(0:00) Open the site.** Point at the **Live from the chain** card: a real testnet block that
   keeps ticking, and the real subnet count. *"This is not a mock-up: it is reading Bittensor
   testnet right now."*
2. **(0:15) Customize.** Click Dark, change the accent, toggle a sign-in method. *"This is the real
   login window. A developer sets this in their dashboard."* Click **Copy to Clipboard**:
   *"and this is the exact code to put in your app."*
3. **(0:40) Log in with Google.** A wallet is created. Show the address starting with `5`.
   *"No extension, no seed phrase."*
4. **(1:00) Send a transaction** (local chain: faucet, then send). Show the popup: amount,
   destination, fee. *"Nothing is signed until the user approves, in plain English."*
5. **(1:30) Permissions.** Grant an agent a limited permission, then revoke it.
   *"AI agents can act for you without ever holding your key, and you can take it back."*
6. **(1:50) Docs.** *"Four packages, nine docs pages, self-host in one command."*

## Questions judges ask, and honest answers

| Question | Answer |
|---|---|
| **Is it live on mainnet?** | No, on purpose. Testnet and a local chain only. Mainnet is disabled until an independent audit and a key-generation ceremony for the server's key share. That is a safety decision, not a gap in the code path. |
| **Who holds the keys?** | Nobody alone. The key is split 2-of-2 between the user's browser and the server, and the server's half is protected by two independent key-share nodes. The full key is never rebuilt to sign. The only exception is the user exporting their own key, inside the wallet frame after logging in again. |
| **What if you disappear?** | The code is open and self-hostable in one command, and the user can export their key to any other wallet. |
| **What is not built?** | Email and passkey login, a wallet button inside the popup, and the server does not yet re-check the two-factor code (it is labelled Preview). Other social sign-ins are shown as "Soon". We would rather say so than fake it. |
| **Has it been tested on testnet?** | Reads and signature validity: yes, live. A funded testnet transfer needs testnet TAO, which has no public faucet, so funded flows are proven on the local chain (68 tests). |
| **Why not just use a browser extension?** | Extensions are the barrier. BitcodeX is for apps that want users to arrive with a Google account and leave with a working wallet. Users who already have an extension can still use it. |
| **How do you make money?** | Not part of this build. The natural model is hosted infrastructure for teams that do not want to run it themselves. |

## What to show, and what not to

- **Show:** the live chain card, the customizable login, the approval popup, the permissions flow,
  the docs, the install-in-30-seconds snippet.
- **Say plainly:** early release, testnet only, mainnet off until an audit.
- **Do not claim:** real users, mainnet readiness, or features marked Soon or Preview.

## Checklist before presenting

- [ ] Open https://bitcodex-demo.vercel.app once, 2 minutes before: Render's free services sleep
      after 15 minutes and the first request takes about a minute.
- [ ] Log in once with your test Google account (it must be on the OAuth consent screen's Test users).
- [ ] If you demo sending TAO, use the local stack (faucet) or a wallet that already holds testnet TAO.
- [ ] Have the video as a backup if the network is slow.
- [ ] Browser zoom 100-110 %, notifications off, other accounts signed out of Chrome.

## Honest note on "winning"

No project is guaranteed to win: judges weigh other entries and your delivery. What this
project has going for it is that **everything shown is real and checkable**, the limits are
stated up front, and a developer can try the SDK in minutes. Present those three things clearly.
