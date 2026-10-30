# BitcodeX

**Embedded wallets for Bittensor.** A user signs in with Google (or a wallet they already
have) and gets a real Bittensor account in seconds: no extension, no seed phrase, no CLI.
Developers add it to any app with a few lines of React.

Live demo: https://bitcodex-demo.vercel.app · Docs: https://bitcodex-demo.vercel.app/docs

---

## The pitch (30 seconds)

Bittensor is an open network where independent teams run "subnets" that produce useful
digital work, such as AI models and data, and are paid in the network's token, **TAO**.
Everything on it, from staking to registering a miner, starts with a **wallet**.

Today that wallet is the front door, and it is a heavy one: install a browser extension or
learn a command-line tool, write down a seed phrase, and keep two kinds of keys straight.
Most people who would use a Bittensor-powered app never get past it.

BitcodeX removes that wall. It does for Bittensor what Privy does for Ethereum and Solana:
**log in with an account you already have, get a wallet, approve each action in a readable
popup.** The key is split so that no single party, including us, can move a user's funds.

## Why Bittensor, and why this matters

- **Bittensor turns machine intelligence into a market.** Subnets compete to deliver useful
  work, and validators score it. Value flows through TAO, so apps built on subnets need to
  hold, stake and send TAO for their users.
- **Apps need accounts, not just chains.** A product that sells access to a subnet, an
  agent that stakes on a user's behalf, a dashboard that shows a user's positions: each needs
  a wallet per user. Without embedded wallets every such app must ask users to bring one.
- **Bittensor has a natural safety model for this.** It separates the **coldkey** (holds
  funds, owns stake) from the **hotkey** (does the mining or validating work), and has
  built-in **proxies**: on-chain permissions that let an app or AI agent act for a user
  within limits the chain itself enforces. BitcodeX uses those directly, so an agent never
  needs the user's key.
- **Onboarding decides adoption.** The easier it is to arrive with a Google account and leave
  with a working wallet, the more people reach subnets, and the more demand those subnets see.

## What BitcodeX gives you

**Your users**
- Sign in with Google or an existing Bittensor wallet (Talisman, SubWallet, Polkadot.js).
- A real Bittensor address (starts with `5`), created on first login.
- See balances, send TAO, stake and unstake, with the exact price shown first.
- Approve every signature in a popup that says what it does, in plain English, with the fee.
- Export their key and take it to any other wallet.

**Your developers**
- A React SDK: `BitcodeXProvider`, `useBitcodeX`, `useBitcodeXBittensor`.
- A wallet API: `sendTao`, `stake`, `registerHotkey`, `grantProxy`, `signMessage`, and more.
- A server package that verifies a signed access token, so your backend knows who is logged in.
- A developer dashboard to create apps, API keys and the allowed-origins list.

## System architecture

```
  Your app (React)                                  Your servers
  ┌───────────────────────────────┐                ┌──────────────────────────────┐
  │ @adityaghgh/sdk-react             │     HTTPS      │ BitcodeX API                 │
  │ @adityaghgh/sdk-bittensor         │───────────────▶│  login · sessions · signing  │
  │                               │                │  access tokens · dev apps    │
  │  ┌─────────────────────────┐  │                └───────────┬──────────────────┘
  │  │ Wallet frame (iframe)    │  │                            │ co-signing
  │  │ own origin, WASM crypto  │  │               ┌────────────▼───────┐ ┌─────────────────┐
  │  │ confirmation popup       │  │               │ Key share node 1   │ │ Key share node 2 │
  │  │ holds the user's share   │  │               └─────────┬──────────┘ └────────┬────────┘
  │  └─────────────────────────┘  │                         └───────┬──────────────┘
  └──────────────┬────────────────┘                          PostgreSQL (3 databases)
                 │ signed extrinsics
                 ▼
         Bittensor chain: local test chain or testnet (mainnet is off)

  Your backend ──▶ verifyAccessToken(token) ──▶ checks the signature against the API's public keys
```

| Component | Where | Job |
|---|---|---|
| React and wallet SDKs | `sdk/` | What your app imports. |
| Wallet frame | `embed/bitcodex_attached` | A static site in an iframe: runs the crypto, shows the popup, holds the user's key share. |
| API | `backend/bitcodex_api` | Google and wallet sign-in, sessions, signing rounds, access tokens, developer apps. |
| Key share nodes (2) | `key_share_node/` | Each stores one share of recovery data and joins signing. Neither can sign alone. |
| Threshold crypto | `crypto/` | Rust: FROST (Ed25519, used for Bittensor) compiled to WASM and a Node addon. |
| Demo and docs | `apps/demo_web` | The live site, with the documentation under `/docs`. |
| Dashboards | `apps/user_dashboard`, `apps/customer_dashboard` | User assets and developer app management. |

## How the key works

A Bittensor **coldkey** is a threshold **Ed25519** key split 2-of-2 between the user's
browser and the BitcodeX server (FROST). A signature needs both halves, and the full private
key is **not rebuilt** to sign. Subtensor accepts Ed25519 accounts, so the result is an
ordinary SS58 address that works in every Bittensor tool.

The server's half is protected by two independent key share nodes. After a new login, the
user's half is recovered from them. The one moment the whole key exists is **Export**: inside
the iframe, after the user logs in again, and it is never sent over the network.

**Hotkeys** sign mining and validating work, so they live on the machine that runs the miner
or validator. BitcodeX never creates them. Users create them with `btcli`, then add the public
address; BitcodeX registers and reads them.

## Flows

**Login and first transaction**
1. App calls `signIn("google")`. A popup goes to Google, and the ID token returns to the wallet frame.
2. The frame asks the API whether the user exists, then runs key generation (new user) or
   recovery (returning user) with the two key share nodes.
3. The SDK reports the address. The app can call `wallet.getAccessToken()`.
4. App calls `bittensorWallet.sendTao("5…", "0.1")`. The frame shows amount, destination and fee.
5. On approval, browser and server produce the two halves of one signature; the frame submits
   the transaction and returns the hash.

**Verify a user on your backend**: the SDK returns a one-hour EdDSA token. Your server calls
`verifyAccessToken(token, { appId, apiUrl })`; it checks the signature against the API's
published keys, the audience (your app ID) and the issuer.

## Which network each feature works on

BitcodeX runs on the **local test chain** and **Bittensor testnet**. Mainnet is off.

| Feature | Local chain | Testnet |
|---|---|---|
| Google and wallet login, key creation, signing | Tested end to end | Signature accepted by the testnet's own check; login needs your Google client |
| Balances, subnets, stake, hotkeys (read) | Tested | Reads work live |
| **Send TAO** | Tested with real transfers | Same code. **Needs testnet TAO**; no funded transfer done yet |
| **Stake, unstake, register a hotkey** | Tested (62 tests, cost = prediction) | Same code. Needs testnet TAO |
| Permissions (proxies): grant, revoke | Tested on chain | Same code. Needs testnet TAO for fees |
| Faucet | Built in (1000 TAO per request) | **None exists** in the official docs. Ask the Bittensor community |
| Demo agent (acts for you with a granted permission) | Yes (public dev key) | Not offered; grant permissions to your own agent's address |
| Hotkey swap, coldkey swap, EVM address, 2-factor code | Preview | Preview |

Everything shown by the demo is read live from the chain: no mock balances, no sample data.

## Add it to your app

```bash
BASE=https://bitcodex-demo.vercel.app/downloads
npm install $BASE/adityaghgh-sdk-react-0.1.0.tgz $BASE/adityaghgh-sdk-bittensor-0.1.0.tgz $BASE/adityaghgh-sdk-core-0.1.0.tgz
```

```tsx
<BitcodeXProvider config={{
  apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
  sdkEndpoint: "https://wallet.your-domain.com",
  bittensor: { chainId: "bittensor:testnet" },
}}>
  <App />
</BitcodeXProvider>

const { signIn } = useBitcodeX();
const { bittensorWallet } = useBitcodeXBittensor();
await signIn("google");
await bittensorWallet.sendTao("5F…", "0.1");
```

The packages are hosted on the demo site so anyone can install them with no account. They
will also be published to npm under `@bitcodex/*`.

## Run your own

| Goal | How |
|---|---|
| Develop locally | `scripts/dev-up.sh` (`--fast` serves production builds). Needs Docker for Postgres and a test chain. |
| One machine | `selfhost/setup.sh`: generates secrets, builds images, starts everything, creates your first app. |
| Render (free to try) | `render.yaml` blueprint. Images are built by GitHub Actions. See `bitcodex-spec/bitcodex-docs/DEPLOY_RENDER.md`. |

Render's free plan sleeps services after 15 minutes and expires its database after 30 days;
use paid instances for real users. Google login needs a Web OAuth client with the wallet
frame's address as an authorized origin and `/google/callback` as a redirect URI.

## Security model

- Only the wallet frame signs, and every signature shows a confirmation popup first. Unknown
  calls get a red warning.
- The frame answers only to sites on the app's allowed-origins list.
- The network is detected from the chain's genesis hash and type, never from a name.
- No key share, seed, token or signature nonce is logged (checked in CI).
- Mainnet is disabled until an independent audit and a distributed key ceremony for the
  server's share are done. **Do not use this with real funds yet.**

## Limits and roadmap

- Not built: email login, passkey login, a wallet button inside the BitcodeX popup.
- Preview: two-factor code before large spends (server co-signing does not check it yet),
  hotkey swap, coldkey swap explainer, Subtensor EVM address.
- npm packages are built and tested but not on the npm registry yet; the licence is not chosen.
- A full browser run with real logins on every path is still being completed.

## Repo map

```
sdk/          SDKs: core, bittensor, react, server, chain helpers
embed/        wallet frame (iframe)
backend/      API, OpenAPI schemas, database migrations
key_share_node/   the two key share nodes
crypto/       Rust threshold signatures (WASM and Node addon)
apps/         demo + docs, user dashboard, developer dashboard
selfhost/     Docker setup for one machine      render.yaml  Render blueprint
scripts/      dev, release, video and check scripts
bitcodex-spec/bitcodex-docs/   design notes, deploy guides, security rules
```
