# @adityaghgh/sdk-react

![license](https://img.shields.io/badge/license-Apache--2.0-blue) ![react](https://img.shields.io/badge/react-%E2%89%A518-149ECA)

React provider and hooks for **BitcodeX on Bittensor**: add Google or wallet login and a real
Bittensor wallet to a React or Next.js app in a few lines.

## Install

```bash
npm install @adityaghgh/sdk-react @adityaghgh/sdk-bittensor @adityaghgh/sdk-core
```

Requires React 18 or newer, and a BitcodeX deployment (an **API key** and the **wallet frame
URL**). Use `skipLibCheck: true` in `tsconfig.json`. Bittensor only: the monorepo's EVM,
Cosmos and Solana options are not included.

## Use

**1. Wrap your app** (in Next.js, in a `"use client"` file):

```tsx
import { BitcodeXProvider } from "@adityaghgh/sdk-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BitcodeXProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
        sdkEndpoint: "https://wallet.your-domain.com", // your wallet frame
        bittensor: { chainId: "bittensor:testnet" },   // or "bittensor:localnet"
      }}
    >
      {children}
    </BitcodeXProvider>
  );
}
```

**2. Log in and use the wallet:**

```tsx
"use client";
import { useBitcodeX } from "@adityaghgh/sdk-react";
import { useBitcodeXBittensor } from "@adityaghgh/sdk-react/bittensor";

export function Wallet() {
  const { isReady, isSignedIn, signIn, signOut } = useBitcodeX();
  const { bittensorWallet, address } = useBitcodeXBittensor();

  if (!isReady) return <p>Loading…</p>;
  if (!isSignedIn) {
    return <button onClick={() => signIn("google")}>Continue with Google</button>;
  }
  return (
    <>
      <p>Your Bittensor address: {address}</p>
      <button onClick={() => bittensorWallet?.sendTao("5F…destination", "0.1")}>
        Send 0.1 TAO
      </button>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
}
```

**3. Verify the user on your server** with `@adityaghgh/server`: get the token in the browser
with `const { wallet } = useBitcodeX(); await wallet?.getAccessToken()`.

## API

**`<BitcodeXProvider config>`**: `apiKey`, `sdkEndpoint`, `bittensor: { chainId }`.

**`useBitcodeX()`** returns `isReady`, `isSignedIn`, `authType`, `email`, `name`, `publicKey`,
`wallet` (the core wallet, with `getAccessToken()`), `signIn(provider)`, `signOut()`,
`openSignInModal(options?)` and `setTheme(theme)`. `openSignInModal` options:
`loginMethods`, `accentColor`, `logoUrl`, `theme`.

**`useBitcodeXBittensor()`** (from `@adityaghgh/sdk-react/bittensor`) returns `bittensorWallet`
(every method of [`@adityaghgh/sdk-bittensor`](https://www.npmjs.com/package/@adityaghgh/sdk-bittensor)),
`address`, `isReady` and `isInitialized`.

## Related

[`@adityaghgh/sdk-bittensor`](https://www.npmjs.com/package/@adityaghgh/sdk-bittensor) ·
[`@adityaghgh/sdk-core`](https://www.npmjs.com/package/@adityaghgh/sdk-core) ·
[`@adityaghgh/server`](https://www.npmjs.com/package/@adityaghgh/server)

Docs and live demo: https://bitcodex-demo.vercel.app/docs · License: Apache-2.0
