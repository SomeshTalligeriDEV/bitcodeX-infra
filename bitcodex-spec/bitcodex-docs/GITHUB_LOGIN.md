# Turn on GitHub login

The code is built end to end (wallet frame `/github/callback`, API token exchange). It stays
off until you give it a GitHub OAuth app. About 10 minutes, free.

## 1. Create the OAuth app
GitHub → your profile → **Settings → Developer settings → OAuth Apps → New OAuth App**.

| Field | Value |
|---|---|
| Application name | BitcodeX |
| Homepage URL | `https://bitcodex-demo.vercel.app` |
| Authorization callback URL | `https://bitcodex-iframe.onrender.com/github/callback` |

Click **Register application**, then **Generate a new client secret**.
- **Client ID**: public, safe to share with me.
- **Client secret**: private. Never paste it in chat, code or an issue.

## 2. Give the secret to the API (Render, not the repo)
Render → **bitcodex-api → Environment** → add:
- `GITHUB_CLIENT_SECRET` = the client secret
- `GITHUB_CLIENT_ID` = the Client ID

Also add `GITHUB_CLIENT_ID` to **bitcodex-ksn1** and **bitcodex-ksn2**, then save (they redeploy).

## 3. Rebuild the wallet frame with the Client ID
The frame bakes the ID in at build time. GitHub → **Actions → images → Run workflow**
(branch `bittensor/phase-0`), fill `github_client_id`, and keep the other inputs:

```
api_url             https://bitcodex-api.onrender.com
google_client_id    364536284636-r2befgs4lcmqmli2jrj2bh5u17ce077t.apps.googleusercontent.com
allowed_origins     http://localhost:3200,https://bitcodex-demo.vercel.app,https://bitcodex-hackathon.vercel.app
github_client_id    <your Client ID>
```

When it is green, redeploy **bitcodex-iframe** in Render (**Manual Deploy**).

## 4. Show the button in the demo
In Vercel, for the project you want (demo and/or hackathon) add
`NEXT_PUBLIC_GITHUB_ENABLED=true` (Environment Variables, Production) and redeploy.
The GitHub row stops saying "Soon" and signs in for real.

## Check
Open the site → **GitHub** → authorise → you land signed in with a Bittensor address.
