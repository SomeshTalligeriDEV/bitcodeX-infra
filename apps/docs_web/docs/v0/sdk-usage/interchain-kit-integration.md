---
title: Interchain Kit Integration
sidebar_position: 10
---

# Interchain Kit Integration

:::warning Beta Feature This integration is currently in beta. APIs may change
in future releases. EVM chain connections are not yet supported. :::

Learn how to integrate BitcodeX Wallet with Interchain Kit, the multi-chain wallet
adapter for Cosmos ecosystem applications.

<!-- prettier-ignore -->
:::tip Get started faster
Prefer a ready-to-run example? Try the **[Interchain Kit (Next.js) starter template](https://github.com/SomeshTalligeriDEV/bitcodeX-infra/tree/main/examples/interchainkit_nextjs)**.
:::

## Overview

`@bitcodex/bitcodex-interchain-kit` is an Interchain Kit wallet connector that
enables your application to use BitcodeX Wallet alongside other Cosmos wallets. This
integration provides a seamless embedded wallet experience while maintaining
compatibility with the Interchain Kit ecosystem.

## Installation

Install the required packages:

```bash
npm install @bitcodex/bitcodex-interchain-kit @interchain-kit/react @interchain-kit/core
```

## Basic Setup

### 1. Create BitcodeX Wallet

Use `makeBitcodeXWallet` to create a wallet instance:

```typescript
import { makeBitcodeXWallet } from "@bitcodex/bitcodex-interchain-kit";

const bitcodexWallet = makeBitcodeXWallet({
  apiKey: "your-bitcodex-api-key",
  sdkEndpoint: "https://your-custom-bitcodex-sdk.example.com", // optional, Only specify if you have your own SDK endpoint
});
```

### 2. Configure ChainProvider

Wrap your application with Interchain Kit's `ChainProvider` and include the BitcodeX
wallets:

```typescript
import { ChainProvider } from "@interchain-kit/react";
import { makeBitcodeXWallet } from "@bitcodex/bitcodex-interchain-kit";
import { chains, assetLists } from "@chain-registry/v2";

const bitcodexWallet = makeBitcodeXWallet({
  apiKey: "your-bitcodex-api-key",
});

export default function App({ Component, pageProps }) {
  return (
    <ChainProvider
      chains={chains}
      assetLists={assetLists}
      wallets={[bitcodexWallet]}
    >
      <Component {...pageProps} />
    </ChainProvider>
  );
}
```

### 3. Connect to BitcodeX Wallet

Use the standard Interchain Kit hooks to interact with BitcodeX Wallet:

```typescript
import { useChain } from "@interchain-kit/react";
import { WalletState } from "@interchain-kit/core";

function WalletConnect() {
  const { openView, disconnect, address, status } = useChain("osmosis");

  return (
    <div>
      {status === WalletState.Connected ? (
        <div>
          <p>Connected: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={openView}>Connect</button>
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

## Signing Transactions

Interchain Kit provides the `wallet` object for signing transactions:

```typescript
import { useChain } from "@interchain-kit/react";
import { SigningStargateClient } from "@cosmjs/stargate";

function SendTransaction() {
  const { address, wallet, getRpcEndpoint } = useChain("osmosis");

  const sendTokens = async () => {
    const offlineSigner = await wallet?.getOfflineSigner();
    if (!offlineSigner || !address) return;

    const rpcEndpoint = await getRpcEndpoint();
    const client = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner,
    );

    const result = await client.sendTokens(
      address,
      "osmo1recipientaddress",
      [{ denom: "uosmo", amount: "1000" }],
      "auto",
    );

    console.log("Transaction hash:", result.transactionHash);
  };

  return <button onClick={sendTokens}>Send Tokens</button>;
}
```

## Next Steps

- **[Cosmos Integration](./cosmos-integration)** - Learn about direct BitcodeX Cosmos
  SDK usage
- **[Error Handling](./error-handling)** - Handle errors gracefully
- **[React Integration](./react-integration)** - React-specific patterns

## Resources

- [Interchain Kit Documentation](https://github.com/cosmology-tech/interchain-kit)
- [Example Application](https://github.com/SomeshTalligeriDEV/bitcodeX-infra/tree/main/examples/interchainkit_nextjs)
- [Chain Registry](https://github.com/cosmos/chain-registry)
