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

Available now: `verifySiwb`, `parseSiwbMessage`, `caip2ChainId`, `getApi` (refuses mainnet
and unknown chains), `actAs`, `getProxies`, `getProxyFilter(s)`, `describePermission`,
`getBalances`, `getStakes`, `getHotkeyInfo`, `listSubnets`.

Not built yet: access-token verification (JWKS), `getUser`, `getWallets`.
