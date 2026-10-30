# @adityaghgh/sdk-react

React provider and hooks for BitcodeX on Bittensor.

```bash
npm install @adityaghgh/sdk-core @adityaghgh/sdk-bittensor @adityaghgh/sdk-react
```

```tsx
import { BitcodeXProvider, useBitcodeX } from "@adityaghgh/sdk-react";
import { useBitcodeXBittensor } from "@adityaghgh/sdk-react/bittensor";

<BitcodeXProvider config={{ apiKey: "YOUR_API_KEY", sdkEndpoint: "https://wallet.example.com", bittensor: { chainId: "bittensor:localnet" } }}>
  <App />
</BitcodeXProvider>;

function App() {
  const { isSignedIn, signIn } = useBitcodeX();
  const { bittensorWallet, address } = useBitcodeXBittensor();
  return isSignedIn
    ? <button onClick={() => bittensorWallet?.sendTao("5F…", "1")}>Send 1 TAO from {address}</button>
    : <button onClick={() => signIn("google")}>Continue with Google</button>;
}
```

This package is Bittensor only; the `eth`, `cosmos` and `svm` options of the monorepo build
are not included.
