# @bitcodex/sdk-bittensor

Embedded Bittensor wallet for your app: users sign in with Google or GitHub and get a
**coldkey** (SS58 prefix 42) held as a 2-of-2 threshold key (FROST Ed25519). No seed
phrase, no extension. Every signature is approved in the BitcodeX popup, which shows the
decoded call, the fee and the requesting site.

```bash
npm install @bitcodex/sdk-core @bitcodex/sdk-bittensor
```

```ts
import { BitcodeXBittensorWallet } from "@bitcodex/sdk-bittensor";

const res = BitcodeXBittensorWallet.init({
  api_key: "YOUR_API_KEY",          // developer dashboard → Apps
  sdk_endpoint: "https://wallet.example.com", // your BitcodeX iframe
  chain_id: "bittensor:localnet",
});
if (!res.success) throw new Error(res.err.msg);
const wallet = res.data;

await wallet.bitcodexWallet.openSignInModal();
const address = await wallet.connect();            // "5…"
await wallet.sendTao("5F…", "1.5");                // transferKeepAlive
await wallet.stake({ netuid: 1, hotkey: "5C…", amountTao: "10" }); // limit order, 1% slippage
```

Also: `signer` (a polkadot.js `Signer`, works with `api.tx…signAndSend`), `signAndSend`,
`signMessage`, `signInWithBittensor` (CAIP-122 profile), `unstake`, `quoteStake`,
`getBalances`, `getStakes`, `getHotkeys`, `registerHotkey`, `swapHotkey`, `grantProxy`,
`revokeProxy`, `getProxies`, `getHistory`, and `injectWeb3` so existing
`@polkadot/extension-dapp` apps see BitcodeX.

Networks: localnet and testnet. Mainnet is disabled until an external security audit.
Status of every feature: `bitcodex-docs/STATUS.md` in the repository.
