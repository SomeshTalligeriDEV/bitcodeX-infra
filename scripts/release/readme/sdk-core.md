# @adityaghgh/sdk-core

![license](https://img.shields.io/badge/license-Apache--2.0-blue) ![network](https://img.shields.io/badge/network-testnet%20%2B%20local-111827)

The foundation of the BitcodeX embedded wallet. It loads the wallet **iframe**, runs login
(Google, GitHub) and carries signing requests to the iframe, which is the only place the
user's key share is ever used.

> Most apps should use [`@adityaghgh/sdk-react`](https://www.npmjs.com/package/@adityaghgh/sdk-react)
> (React) or [`@adityaghgh/sdk-bittensor`](https://www.npmjs.com/package/@adityaghgh/sdk-bittensor)
> (wallet actions). Install `sdk-core` directly only if you are building your own integration.

## Install

```bash
npm install @adityaghgh/sdk-core
```

Requires a browser (it creates an iframe). Use `skipLibCheck: true` in `tsconfig.json`
(the Next.js default): the shared types mention optional EVM and Cosmos libraries
(`viem`, `@keplr-wallet/types`, `@cosmjs/amino`) that Bittensor apps do not need.

## Use

```ts
import { BitcodeXWallet } from "@adityaghgh/sdk-core";

const res = BitcodeXWallet.init({
  api_key: "YOUR_API_KEY",                       // from your BitcodeX developer dashboard
  sdk_endpoint: "https://wallet.your-domain.com", // your wallet frame (iframe) URL
});
if (!res.success) throw new Error(res.err.msg);
const wallet = res.data;

await wallet.waitUntilInitialized;
await wallet.openSignInModal();            // the BitcodeX login window
const token = await wallet.getAccessToken(); // signed token for YOUR backend (or null)
await wallet.signOut();
```

## API

| Member | What it does |
|---|---|
| `BitcodeXWallet.init(args)` | Create the wallet. `args`: `api_key`, `sdk_endpoint`, optional `theme`. Returns `{ success, data }`. |
| `waitUntilInitialized` | Resolves when the iframe is ready. |
| `openSignInModal(options?)` | Open the login window. `options`: `loginMethods`, `accentColor`, `logoUrl`, `theme`. |
| `signIn(type)` / `signOut()` | Start a login with one method / end the session. |
| `getAccessToken()` | One-hour signed token. Verify it on your server with `@adityaghgh/server`. |
| `getPublicKey()`, `getEmail()`, `getName()`, `getAuthType()` | Who is signed in. |
| `setTheme("light" \| "dark")` | Theme of the wallet window. |
| `on(handler)` / `off(handler)` | Subscribe to account and session events. |

## Related

- [`@adityaghgh/sdk-bittensor`](https://www.npmjs.com/package/@adityaghgh/sdk-bittensor): send TAO, stake, hotkeys, permissions.
- [`@adityaghgh/sdk-react`](https://www.npmjs.com/package/@adityaghgh/sdk-react): provider and hooks.
- [`@adityaghgh/server`](https://www.npmjs.com/package/@adityaghgh/server): verify users on your backend.

Docs and live demo: https://bitcodex-demo.vercel.app/docs · License: Apache-2.0
