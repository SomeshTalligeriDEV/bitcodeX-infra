# Deploy BitcodeX on Render (testnet)

Render runs the API, two key share nodes and Postgres from `render.yaml`. The images are
built by GitHub Actions (`.github/workflows/images.yml`) and pulled from GHCR; Render
never builds the Rust addons. Bittensor testnet only.

**Free plan limits (honest):** free web services sleep after 15 minutes idle, so the
first request after a pause takes about a minute. Free Postgres expires after 30 days.
Fine for a demo; for real users move the four services to Starter (about $7 each per
month) and the database to a paid plan.

## 1. Images on GHCR
1. GitHub → repo → **Actions** → **images** → the latest run must be green.
2. GitHub → your profile → **Packages** → `bitcodex-api` → **Package settings** →
   **Change visibility → Public**. Same for `bitcodex-ksn`. (Or keep them private and add
   a GHCR registry credential in Render and reference it in `render.yaml`.)

## 2. Access-token signing key (on your machine)
```bash
openssl genpkey -algorithm ed25519 | base64 | tr -d '\n'; echo
```
Keep the output for step 3. Never commit it.

## 3. Create the blueprint
1. Render → **New → Blueprint** → connect the GitHub repo → branch `bittensor/phase-0`.
2. Render reads `render.yaml` and asks for the `sync: false` values:
   - `GOOGLE_CLIENT_ID`: your Google OAuth client ID.
   - `BITCODEX_ACCESS_TOKEN_KEY`: the output of step 2.
   - `BITCODEX_API_BASE_URL` (both key share nodes): `https://bitcodex-api.onrender.com`
     (use the API's real address if Render gave it a suffix).
3. **Apply.** The API starts and creates its tables. The key share nodes fail until
   step 5; that is expected.

## 4. Key share node encryption secret
```bash
openssl rand -hex 32
```
In Render, for **bitcodex-ksn1** and **bitcodex-ksn2**: **Environment → Secret Files →
Add**, filename `ksn_encryption_secret.txt`, contents = that value (the same on both).
Losing it makes the stored key shares unreadable, so keep a copy somewhere safe.

## 5. Databases and first app (from your machine)
Copy **bitcodex-db → Connect → External Database URL**, then:
```bash
BITCODEX_DATABASE_URL='<external URL>' \
BITCODEX_API_URL=https://bitcodex-api.onrender.com \
BITCODEX_KSN_PUBLIC_URLS=https://bitcodex-ksn1.onrender.com,https://bitcodex-ksn2.onrender.com \
BITCODEX_APP_ORIGINS=http://localhost:3200 \
scripts/render_bootstrap.sh
```
It creates `bitcodex_ksn1` and `bitcodex_ksn2`, registers the nodes and creates your
first app. **It prints the API key, app secret and dashboard password once; save them.**
Then restart both key share nodes in Render.

## 6. Wallet iframe
The iframe bakes in its public settings, so it is built after the API has an address.
1. GitHub → repo → **Settings → Secrets and variables → Actions → Variables**, add:
   - `BITCODEX_PUBLIC_API_URL` = `https://bitcodex-api.onrender.com`
   - `BITCODEX_GOOGLE_CLIENT_ID` = your Google client ID
   - `BITCODEX_ALLOWED_ORIGINS` = the sites that may embed the wallet, comma-separated
2. **Actions → images → Run workflow.** When green, make `bitcodex-iframe` public (step 1).
3. Render → **New → Web Service → Existing image** →
   `ghcr.io/someshtalligeridev/bitcodex-iframe:latest`, name `bitcodex-iframe`, free plan,
   health check path `/health`.

## 7. Google OAuth client
Google Cloud Console → Credentials → your OAuth client:
- **Authorized JavaScript origins:** `https://bitcodex-iframe.onrender.com`
- **Authorized redirect URIs:** `https://bitcodex-iframe.onrender.com/google/callback`

## 8. Use it in an app
```ts
<BitcodeXProvider config={{
  apiKey: "<API key from step 5>",
  sdkEndpoint: "https://bitcodex-iframe.onrender.com",
  bittensor: { chainId: "bittensor:testnet" },
}}>
```
The app's origin must be in the app's allowed origins (step 5 or the developer dashboard).

## Checks
```bash
curl -s https://bitcodex-api.onrender.com/            # API up
curl -s https://bitcodex-ksn1.onrender.com/           # key share node 1 up
curl -s https://bitcodex-iframe.onrender.com/health   # iframe up
```
Then run `PENDING_BROWSER_CHECKS.md` against the live iframe.
