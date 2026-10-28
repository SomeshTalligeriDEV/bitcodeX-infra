---
title: Cosmos Kit Integration
sidebar_position: 9
---

# Cosmos Kit Integration

Learn how to integrate BitcodeX Wallet with Cosmos Kit, the popular wallet adapter
for Cosmos ecosystem applications.

<!-- prettier-ignore -->
:::tip Get started faster
Prefer a ready-to-run example? Try the **[Cosmos Kit (Next.js) starter template](https://github.com/SomeshTalligeriDEV/bitcodeX-infra/tree/main/examples/cosmos-kit-nextjs)**.
:::

## Overview

`@bitcodex/bitcodex-cosmos-kit` is a Cosmos Kit wallet connector that enables your
application to use BitcodeX Wallet alongside other Cosmos wallets. This integration
provides a seamless embedded wallet experience while maintaining compatibility
with the Cosmos Kit ecosystem.

## Installation

Install the required packages:

```bash
npm install @bitcodex/bitcodex-cosmos-kit @cosmos-kit/react @cosmos-kit/core
```

You'll also need the CosmJS peer dependencies:

```bash
npm install @cosmjs/amino @cosmjs/proto-signing
```

## Basic Setup

### 1. Create BitcodeX Wallet

Use `makeBitcodeXWallet` to create a wallet instance:

```typescript
import { makeBitcodeXWallet } from "@bitcodex/bitcodex-cosmos-kit";

const bitcodexWallet = makeBitcodeXWallet({
  apiKey: "your-bitcodex-api-key",
  sdkEndpoint: "https://your-custom-bitcodex-sdk.example.com", // optional, Only specify if you have your own SDK endpoint
});
```

### 2. Configure ChainProvider

Wrap your application with Cosmos Kit's `ChainProvider` and include the BitcodeX
wallets:

```typescript
import { ChainProvider } from "@cosmos-kit/react";
import { makeBitcodeXWallet } from "@bitcodex/bitcodex-cosmos-kit";
import { chains, assets } from "chain-registry";

const bitcodexWallet = makeBitcodeXWallet({
  apiKey: "your-bitcodex-api-key",
});

export default function App({ Component, pageProps }) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={[bitcodexWallet]}
    >
      <Component {...pageProps} />
    </ChainProvider>
  );
}
```

### 3. Connect to BitcodeX Wallet

Use the standard Cosmos Kit hooks to interact with BitcodeX Wallet:

```typescript
import { useChain } from "@cosmos-kit/react";

function WalletConnect() {
  const { connect, disconnect, address, status, wallet } = useChain(
    "cosmoshub",
  );

  const connectBitcodeX = async () => {
    await connect();
  };

  return (
    <div>
      {status === "Connected" ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connectBitcodeX}>Connect</button>
      )}
    </div>
  );
}
```

## Configuration Options

### BitcodeXWalletOptions

The `makeBitcodeXWallet` function accepts the following options:

```typescript
interface BitcodeXWalletOptions {
  // Your BitcodeX API key (required)
  apiKey: string;

  // Custom SDK endpoint (optional)
  // Defaults to BitcodeX's production endpoint
  sdkEndpoint?: string;
}
```

### Login Providers

When connecting, users can select their preferred login provider from a modal:

- Google OAuth
- Email/passwordless
- X (Twitter) OAuth
- Discord OAuth
- Telegram OAuth

## Next Steps

- **[Cosmos Integration](./cosmos-integration)** - Learn about direct BitcodeX Cosmos
  SDK usage
- **[Error Handling](./error-handling)** - Handle errors gracefully
- **[React Integration](./react-integration)** - React-specific patterns

## Resources

- [Cosmos Kit Documentation](https://docs.hyperweb.io/cosmos-kit)
- [Example Application](https://github.com/SomeshTalligeriDEV/bitcodeX-infra/tree/main/examples/cosmos-kit-nextjs)
- [Chain Registry](https://github.com/cosmos/chain-registry)
