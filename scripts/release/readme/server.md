# @bitcodex/server

BitcodeX for your backend (Node 22+).

```ts
import { verifySiwb, actAs, getApi } from "@bitcodex/server";

// Sign-In with Bittensor: check what the browser sent.
const r = verifySiwb(message, signature, { domain: "app.example.com", nonce, genesisHash });

// Act for a user within a permission (proxy) they granted to your agent key.
const api = await getApi("bittensor:localnet");
if (api.success) {
  await actAs(api.data, agentKeyPair, userAddress, "Staking",
    api.data.tx.subtensorModule.addStake(hotkey, netuid, amountRao));
}
```

```ts
// Access tokens: your frontend calls `bitcodexWallet.getAccessToken()` and sends it to you.
import { verifyAccessToken, createServerClient } from "@bitcodex/server";
const v = await verifyAccessToken(token, { appId: "YOUR_APP_ID", apiUrl: "https://api.example.com" });
if (v.success) console.log(v.data.userId, v.data.address);

// Server API with your app secret (never in a browser).
const bitcodex = createServerClient({ apiUrl, appId, appSecret });
const user = await bitcodex.getUser(v.data.userId);   // linked accounts + wallets
const wallets = await bitcodex.getWallets(v.data.userId);
```

Available now: `verifyAccessToken` (EdDSA JWT via the API's JWKS; errors `token_expired`,
`invalid_signature`, `wrong_audience`, `wrong_issuer`), `createServerClient` (`getUser`,
`getWallets`, retries on 429/5xx), `verifySiwb`, `parseSiwbMessage`, `caip2ChainId`, `getApi` (refuses mainnet
and unknown chains), `actAs`, `getProxies`, `getProxyFilter(s)`, `describePermission`,
`getBalances`, `getStakes`, `getHotkeyInfo`, `listSubnets`.

Users are scoped per developer account (all apps of one account see the same users).
