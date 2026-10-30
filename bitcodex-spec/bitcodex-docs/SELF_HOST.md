# Self-host BitcodeX

One machine, one command. Runs Postgres, the BitcodeX API, two key share nodes and the
wallet iframe in Docker, on Bittensor **testnet** (default) or a **localnet**. Mainnet is
disabled until an external security audit.

## Requirements
- Docker with Compose v2 (`docker compose` or `docker-compose`), 8 GB RAM free for the
  first build (it compiles the Rust threshold-signing code), about 10 GB disk.
- A Google OAuth client (Web application) from Google Cloud Console → Credentials:
  - Authorized JavaScript origin: `http://localhost:3201` (the iframe URL)
  - Authorized redirect URI: `http://localhost:3201/google/callback`

## Run
```bash
selfhost/setup.sh
```
It asks for the Google client ID, the network (testnet/localnet) and your app's origin.
Then it:
1. writes `selfhost/.env` (mode 600) with every generated secret, plus the key share
   node encryption secret in `selfhost/secrets/` (directory mode 700);
2. builds the images and starts all services, waiting for every health check;
3. runs the one-shot bootstrap: registers the two key share nodes, enables signing,
   creates one developer account (random password) and one app.

The bootstrap prints the **app ID, API key, app secret and developer password once**. Save
them. Re-running prints only the app ID and API key.

In your app: `sdkEndpoint: "http://localhost:3201"`, `apiKey: <API key>`,
`chainId: "bittensor:testnet"`.

## Services
| Service | Port | Health check | Restart |
|---|---|---|---|
| postgres | (internal) | `pg_isready` | unless-stopped |
| api | 4200 | `GET /` | unless-stopped |
| ksn1, ksn2 | 4201, 4202 | `GET /` | unless-stopped |
| iframe | 3201 | `GET /health` | unless-stopped |
| bootstrap | (one-shot) | | no |

The browser calls the key share nodes at their public URLs (`PUBLIC_KSN*_URL`); the API
reaches the same nodes inside the Docker network (`BITCODEX_KSN_INTERNAL_URLS`).

## Serving on a domain
Edit the `PUBLIC_*_URL` values in `selfhost/.env`, add the new iframe origin and redirect
URI to the Google client, then `selfhost/setup.sh --rebuild` (the iframe bakes its
settings in at build time). Key share node URLs are stored at bootstrap: register new ones
in the admin web, or bootstrap a fresh database.

## Testnet funding
The official Bittensor docs list no testnet faucet, so the self-host has none. On
localnet, the API's faucet (`//Alice`, a public dev account) is enabled.

## Not included yet
Email login (no mail server), the developer and user dashboards as containers, TLS
(put a reverse proxy or a tunnel in front), backups beyond the key share node's startup
dump.
