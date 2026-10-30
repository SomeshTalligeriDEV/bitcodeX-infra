# @adityaghgh/server

![license](https://img.shields.io/badge/license-Apache--2.0-blue) ![node](https://img.shields.io/badge/node-%E2%89%A522-339933)

BitcodeX for your **backend**. Verify who is logged in, read users and wallets, verify
Sign-In with Bittensor, and act for a user within an on-chain permission they granted.

## Install

```bash
npm install @adityaghgh/server
```

Requires Node 22 or newer. Server only: never import it in browser code, because it uses your
**app secret**.

## Verify a logged-in user

Your frontend sends the token from `wallet.getAccessToken()` (see `@adityaghgh/sdk-react`).

```ts
import { verifyAccessToken } from "@adityaghgh/server";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const result = await verifyAccessToken(token, {
    appId: process.env.BITCODEX_APP_ID!,
    apiUrl: process.env.BITCODEX_API_URL!, // your BitcodeX API, e.g. https://api.your-domain.com
  });
  if (!result.success) return Response.json({ error: result.err }, { status: 401 });

  const { userId, address, expiresAt } = result.data;
  return Response.json({ userId, address });
}
```

The token is an EdDSA JWT valid for one hour, checked against the API's published keys, your
app ID (audience) and the issuer. Errors: `token_expired`, `invalid_signature`,
`wrong_audience`, `wrong_issuer`, `invalid_token`. Never trust a user ID sent by the browser.

## Read users and wallets

```ts
import { createServerClient } from "@adityaghgh/server";

const bitcodex = createServerClient({
  apiUrl: process.env.BITCODEX_API_URL!,
  appId: process.env.BITCODEX_APP_ID!,
  appSecret: process.env.BITCODEX_APP_SECRET!, // server only, never in a browser
});

const user = await bitcodex.getUser(userId);       // linked accounts, created_at
const wallets = await bitcodex.getWallets(userId); // [{ chain: "bittensor", address, ... }]
```

Retries read calls on network errors, 429 and 5xx. Users are scoped per developer account
(all apps of one account see the same users).

## Verify Sign-In with Bittensor

```ts
import { verifySiwb } from "@adityaghgh/server";

const r = verifySiwb(message, signature, {
  domain: "app.example.com",
  nonce,          // the one-time value YOUR server issued for this sign-in
  genesisHash,    // the chain you accept
});
if (r.success) console.log("verified wallet:", r.data);
```

## Act for a user within a permission

```ts
import { actAs, getApi } from "@adityaghgh/server";

const api = await getApi("bittensor:testnet");
if (api.success) {
  // agentKeyPair is your agent's polkadot.js KeyringPair. The chain enforces the proxy type.
  await actAs(api.data, agentKeyPair, userAddress, "Staking",
    api.data.tx.subtensorModule.addStake(hotkey, netuid, amountRao));
}
```

## API

`verifyAccessToken`, `createServerClient` (`getUser`, `getWallets`), `verifySiwb`,
`parseSiwbMessage`, `caip2ChainId`, `getApi` (refuses mainnet and unknown chains), `actAs`,
`getProxies`, `getProxyFilter(s)`, `describePermission`, `getBalances`, `getStakes`,
`getHotkeyInfo`, `listSubnets`, `formatTaoAmount`, `parseUnits`.

## Keep it safe

- Keep `BITCODEX_APP_SECRET` out of browsers, logs and any `NEXT_PUBLIC_` variable. Rotate it
  in the developer dashboard if it leaks.
- Always verify the access token before trusting a request.
- Networks: local chain and testnet only. Mainnet is disabled until an independent audit.

## Related

[`@adityaghgh/sdk-react`](https://www.npmjs.com/package/@adityaghgh/sdk-react) ·
[`@adityaghgh/sdk-bittensor`](https://www.npmjs.com/package/@adityaghgh/sdk-bittensor) ·
[`@adityaghgh/sdk-core`](https://www.npmjs.com/package/@adityaghgh/sdk-core)

Docs and live demo: https://bitcodex-demo.vercel.app/docs · License: Apache-2.0
