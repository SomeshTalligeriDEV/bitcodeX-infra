# How BitcodeX works

BitcodeX gives any Bittensor app what Privy gives Ethereum apps: users sign in with
Google (or a wallet), get a real Bittensor account with no extension and no seed phrase,
and approve every signature in a readable popup. It runs on **testnet and local chains
only**; mainnet is off until an external audit.

Live docs: the `/docs` section of the demo site. Honest feature status:
[STATUS.md](STATUS.md).

## The pieces

```
 your app (React)                       your servers
 ┌──────────────────────┐              ┌────────────────────────────┐
 │ @bitcodex/sdk-react   │   HTTPS      │ BitcodeX API               │
 │ @bitcodex/sdk-bittensor│────────────▶│  login, sessions, signing, │
 │                      │              │  access tokens, dev apps   │
 │  ┌─────────────────┐ │              └──────┬─────────────────────┘
 │  │ wallet frame     │ │                     │ co-signing
 │  │ (iframe, own     │ │              ┌──────▼──────┐ ┌───────────┐
 │  │  origin)         │ │              │ key share   │ │ key share │
 │  │ holds user share │ │              │ node 1      │ │ node 2    │
 │  └─────────────────┘ │              └─────────────┘ └───────────┘
 └──────────┬───────────┘                      │ PostgreSQL (3 databases)
            │ signed extrinsics
            ▼
      Bittensor chain (local or testnet)
```

| Piece | What it does |
|---|---|
| `sdk/` | SDKs your app imports: core, Bittensor wallet, React hooks, server helpers. |
| `embed/bitcodex_attached` | The **wallet frame**: a static site loaded in an iframe. Runs the crypto (WASM), shows the confirmation popup, holds the user's key share. |
| `backend/bitcodex_api` | The **API**: Google/wallet sign-in, sessions, signing rounds, access tokens, faucet (local), developer apps. |
| `key_share_node/` | Two **key share nodes** that each store one share of recovery data and join signing. |
| `crypto/` | Rust threshold signatures: FROST (Ed25519, used for Bittensor) and Cait-Sith (secp256k1). |
| `apps/` | The demo (the live site you see), user dashboard, developer dashboard. |

## The key model

A Bittensor **coldkey** holds funds and owns stake. BitcodeX makes it a threshold
**Ed25519** key, split 2-of-2 between the user's browser and the BitcodeX server
(FROST). A signature needs both sides and the full private key is **not rebuilt** to sign.
Subtensor accepts Ed25519 accounts, so the result is a normal SS58 address starting with `5`.

The server's share is protected by two independent **key share nodes**. After a new login
the user's share is recovered from them.

**Hotkeys** sign mining and validating work, so they live on the machine that runs the
miner or validator and are **never created here**. Users create them with `btcli` and add
the public address; BitcodeX registers and reads them.

The one time the whole key exists is **Export**: inside the iframe, after logging in
again, never sent over the network.

## Login → first transaction

1. App calls `signIn("google")` (or opens the login window). A popup goes to Google.
2. Google returns an ID token to the wallet frame's `/google/callback`.
3. The frame asks the API whether the user exists, then runs a key generation (new user)
   or a recovery (returning user) with the two key share nodes.
4. The SDK reports the address. The app can call `wallet.getAccessToken()`.
5. App calls `bittensorWallet.sendTao("5…", "0.1")`. The frame shows the popup:
   amount, destination, fee. The user approves.
6. Browser and server produce the two halves of one Ed25519 signature; the frame submits
   the extrinsic to the chain and reports `txHash`.

## Verifying users on your backend

The SDK returns a short-lived (1 hour) EdDSA JWT. Your server calls
`verifyAccessToken(token, { appId, apiUrl })`; it checks the signature against the API's
published keys (`/.well-known/jwks.json`), the audience (your app ID) and the issuer.

## Safety rules the code enforces

- Only the wallet frame signs; every signature shows a confirmation; unknown calls get a
  red warning.
- The frame answers only to **allowed origins** (fail closed).
- Network is detected by **genesis hash and chain type**, never by name; mainnet is refused.
- No key share, seed, JWT or OAuth token is logged (`scripts/check_secret_logs.sh` in CI).
- Optional two-factor (TOTP) before large spends (preview).

## Run it

| Goal | Where |
|---|---|
| Develop locally (Docker for Postgres and a test chain) | `scripts/dev-up.sh` (`--fast` serves production builds) |
| One machine, one command | `selfhost/setup.sh` → [SELF_HOST.md](SELF_HOST.md) |
| Render free plan | [DEPLOY_RENDER.md](DEPLOY_RENDER.md) |
| Typecheck and lint | `yarn ci typecheck`, `yarn exec biome check .` |

## Add it to your app

```tsx
<BitcodeXProvider config={{ apiKey, sdkEndpoint, bittensor: { chainId: "bittensor:testnet" } }}>
  <App />
</BitcodeXProvider>

const { signIn } = useBitcodeX();
const { bittensorWallet } = useBitcodeXBittensor();
await signIn("google");
await bittensorWallet.sendTao("5F…", "0.1");
```

Full guide: `/docs/quickstart` on the demo site.

## Testnet TAO

A new wallet has 0 TAO. The official Bittensor docs list no automatic public testnet
faucet, so testnet TAO is requested from the Bittensor community. If you run a faucet
website, set `NEXT_PUBLIC_TESTNET_FAUCET_URL` in the demo and the wallet shows an
"Open faucet" button. The local chain has a built-in faucet (`BITCODEX_FAUCET_SURI`).

## Known limits

- npm packages are built and tested but **not published**; licence not chosen.
- Email and passkey login are not built.
- Mainnet is off by design.
- Render's free plan sleeps after 15 minutes and its database expires after 30 days.
