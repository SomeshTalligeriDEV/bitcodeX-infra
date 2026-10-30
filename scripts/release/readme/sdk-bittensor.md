# @adityaghgh/sdk-bittensor

![license](https://img.shields.io/badge/license-Apache--2.0-blue) ![network](https://img.shields.io/badge/network-testnet%20%2B%20local-111827)

An embedded **Bittensor wallet** for your app. Users sign in with Google or GitHub and get a
**coldkey** (SS58 address starting with `5`) held as a 2-of-2 threshold Ed25519 key (FROST).
No seed phrase, no extension. Every signature is approved in a popup that shows the decoded
call, the fee and the requesting site.

## Install

```bash
npm install @adityaghgh/sdk-bittensor @adityaghgh/sdk-core
```

Runs in the browser. Pair it with your BitcodeX deployment: you need an **API key** and the
**wallet frame URL** (see the self-host guide in the docs).

## Use

```ts
import { BitcodeXBittensorWallet } from "@adityaghgh/sdk-bittensor";

const res = BitcodeXBittensorWallet.init({
  api_key: "YOUR_API_KEY",                        // developer dashboard → Apps
  sdk_endpoint: "https://wallet.your-domain.com", // your wallet frame
  chain_id: "bittensor:testnet",                  // or "bittensor:localnet"
});
if (!res.success) throw new Error(res.err.msg);
const wallet = res.data;

await wallet.bitcodexWallet.openSignInModal();   // login window
const address = await wallet.connect();           // "5…"
const { transferable } = await wallet.getBalances(); // bigint, in rao

// The user sees amount, destination and fee, and must approve.
const { txHash } = await wallet.sendTao("5F…destination", "0.5");
```

### Stake, hotkeys and permissions

```ts
const quote = await wallet.quoteStake({ netuid: 2, amountTao: "5" });   // exact price and slippage
await wallet.stake({ netuid: 2, hotkey: "5Val…", amountTao: "5" });
const positions = await wallet.getStakes();

// Hotkeys are created on your miner machine (btcli); BitcodeX registers and reads them.
const cost = await wallet.quoteRegistration(2);
await wallet.registerHotkey({ netuid: 2, hotkey: "5Hot…" });

// Let an app or agent act for the user, limited and revocable (on-chain proxy).
await wallet.grantProxy({ delegate: "5Agent…", proxyType: "Staking" });
const { delegations } = await wallet.getProxies();
await wallet.revokeProxy({ delegate: "5Agent…", proxyType: "Staking" });
```

### Sign a message, Sign-In with Bittensor

```ts
const signature = await wallet.signMessage("Welcome to my app");
const { message, signature: sig } = await wallet.signInWithBittensor({ nonce }); // CAIP-122
// on your server: verifySiwb(message, sig, { domain, nonce, genesisHash })  (@adityaghgh/server)
```

### Log in with an existing wallet (Talisman, SubWallet, Polkadot.js)

```ts
const accounts = await wallet.listExtensionAccounts("My app");
const { accessToken } = await wallet.loginWithWallet(accounts[0]);
await wallet.linkWallet(accounts[0]); // already signed in? link it to the same user
```

## API

`connect`, `getAddress`, `getBalances`, `sendTao`, `quoteStake`, `stake`, `quoteUnstake`,
`unstake`, `getStakes`, `listSubnets`, `getHotkeys`, `getHotkeyInfo`, `quoteRegistration`,
`registerHotkey`, `swapHotkey` (local chain only, preview), `getProxies`, `grantProxy`,
`revokeProxy`, `getHistory`, `signMessage`, `signAndSend`, `signInWithBittensor`,
`listExtensionAccounts`, `loginWithWallet`, `linkWallet`, `api()` (the polkadot.js `ApiPromise`),
`getEvmAccount` (preview), and `injectWeb3` so existing `@polkadot/extension-dapp` apps see
BitcodeX as a wallet.

If the user closes a popup, the call rejects with `USER_CANCELLED` (exported). Treat that as
a normal outcome.

## Networks

Local chain and Bittensor **testnet**. Mainnet is disabled until an independent security
audit. Testnet TAO has no automatic faucet: ask the Bittensor community for some.

## Related

[`@adityaghgh/sdk-react`](https://www.npmjs.com/package/@adityaghgh/sdk-react) ·
[`@adityaghgh/sdk-core`](https://www.npmjs.com/package/@adityaghgh/sdk-core) ·
[`@adityaghgh/server`](https://www.npmjs.com/package/@adityaghgh/server)

Docs and live demo: https://bitcodex-demo.vercel.app/docs · License: Apache-2.0
