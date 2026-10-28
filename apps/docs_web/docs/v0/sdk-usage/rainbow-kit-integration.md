---
title: RainbowKit Integration
sidebar_position: 6
---

# RainbowKit Integration

Learn how to integrate BitcodeX with RainbowKit for seamless Web3 wallet
connectivity.

<!-- prettier-ignore -->
:::tip Get started faster
Prefer a ready-to-run example? Try the **[EVM + wagmi (Next.js) starter template](https://github.com/SomeshTalligeriDEV/bitcodeX-infra/tree/main/examples/evm-wagmi-nextjs)**.
:::

## Prerequisites

Before you begin, ensure you have:

- [RainbowKit](https://rainbowkit.com/docs/installation) installed in your
  project
- BitcodeX SDK packages

## Installation

First, install the required dependencies:

```bash
npm install @rainbow-me/rainbowkit @bitcodex/bitcodex-sdk-eth wagmi viem
```

## Step 1: Create Custom BitcodeX Connector

### Import Required Dependencies

```typescript
import {
  connectorsForWallets,
  WalletDetailsParams,
  Wallet,
} from "@rainbow-me/rainbowkit";
import { createConfig, CreateConnectorFn, createConnector } from "wagmi";
import { getAddress, toHex } from "viem";
import {
  BitcodeXEIP1193Provider,
  BitcodeXEthWalletInterface,
  type BitcodeXEthWalletInitArgs,
} from "@bitcodex/bitcodex-sdk-eth";

const bitcodexIcon = "data:image/svg+xml;base64,..."; // BitcodeX icon here

function bitcodexConnector(
  walletDetails: WalletDetailsParams,
  args: BitcodeXEthWalletInitArgs,
): CreateConnectorFn {
  let bitcodexEth: BitcodeXEthWalletInterface | null = null;
  let cachedProvider: BitcodeXEIP1193Provider | null = null;

  async function initBitcodeXEthOnce(): Promise<BitcodeXEthWalletInterface> {
    if (bitcodexEth) {
      return bitcodexEth;
    }

    const { BitcodeXEthWallet } = await import("@bitcodex/bitcodex-sdk-eth");
    const initRes = BitcodeXEthWallet.init(args);

    if (!initRes.success) {
      throw new Error(`init fail: ${initRes.err}`);
    }

    await initRes.data.waitUntilInitialized;

    bitcodexEth = initRes.data;

    return bitcodexEth;
  }

  return createConnector<BitcodeXEIP1193Provider>((config) => {
    const wallet = {
      id: "bitcodex",
      name: "BitcodeX",
      type: "bitcodex" as const,
      icon: bitcodexIcon,
      setup: async () => {
        if (typeof window !== "undefined") {
          await initBitcodeXEthOnce();
        }
      },
      connect: async (parameters?: {
        chainId?: number | undefined;
        isReconnecting?: boolean | undefined;
      }) => {
        if (!bitcodexEth) {
          await initBitcodeXEthOnce();

          throw new Error("bitcodex sdk is just initialized");
        }

        let accounts = await wallet.getAccounts();

        if (accounts.length === 0) {
          if (parameters?.isReconnecting) {
            return {
              accounts,
              chainId: await wallet.getChainId(),
            };
          }
          await bitcodexEth.bitcodexWallet.signIn("google");
        }

        const chainId = await wallet.getChainId();
        accounts = await wallet.getAccounts();

        return {
          accounts,
          chainId,
        };
      },
      disconnect: async () => {
        const provider = await wallet.getProvider();
        provider.removeListener("accountsChanged", wallet.onAccountsChanged);
        provider.removeListener("chainChanged", wallet.onChainChanged);
        if (bitcodexEth) {
          await bitcodexEth.bitcodexWallet.signOut();
        }
      },
      getAccounts: async () => {
        const provider = await wallet.getProvider();
        const accounts = await provider.request({
          method: "eth_accounts",
        });
        return accounts.map((x: string) => getAddress(x));
      },
      getChainId: async () => {
        const provider = await wallet.getProvider();
        const chainId = await provider.request({
          method: "eth_chainId",
        });
        return Number(chainId);
      },
      getProvider: async () => {
        if (cachedProvider) {
          return cachedProvider;
        }

        const bitcodexEth = await initBitcodeXEthOnce();

        cachedProvider = await bitcodexEth.getEthereumProvider();

        cachedProvider.on("chainChanged", (chainId) => {
          wallet.onChainChanged(chainId);
        });

        cachedProvider.on("accountsChanged", (accounts) => {
          wallet.onAccountsChanged(accounts);
        });

        return cachedProvider;
      },
      isAuthorized: async () => {
        const accounts = await wallet.getAccounts();
        return accounts.length > 0;
      },
      switchChain: async ({ chainId }: { chainId: number }) => {
        const chain = config.chains.find((network) => network.id === chainId);
        if (!chain) {
          throw new Error(`Chain ${chainId} not found`);
        }

        const provider = await wallet.getProvider();
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: toHex(chainId) }],
        });

        return chain;
      },
      onAccountsChanged: (accounts: string[]) => {
        if (accounts.length === 0) {
          wallet.onDisconnect();
        } else {
          config.emitter.emit("change", {
            accounts: accounts.map((x: string) => getAddress(x)),
          });
        }
      },
      onChainChanged: (chainId: string | number) => {
        const chainIdNumber = Number(chainId);
        config.emitter.emit("change", { chainId: chainIdNumber });
      },
      onDisconnect: () => {
        config.emitter.emit("disconnect");
      },
      ...walletDetails,
    };

    return wallet;
  });
}
```

### Create Wallet Configuration Function

```typescript
function toBitcodeX(args: BitcodeXEthWalletInitArgs): () => Wallet {
  return () => ({
    id: "bitcodex",
    name: "BitcodeX",
    iconUrl: bitcodexIcon,
    shortName: "BitcodeX",
    rdns: "bitcodex.app",
    iconBackground: "#f2641d",
    installed: true,
    createConnector: (walletDetails) => bitcodexConnector(walletDetails, args),
  });
}
```

## Step 2: Configure Wagmi with Keplr

### Create Wagmi Configuration

<!-- prettier-ignore -->
::::tip Supported chains
You can find the list of supported EVM chains in the Keplr Chain Registry on GitHub: [Keplr Chain Registry (EVM)](https://github.com/chainapsis/keplr-chain-registry/tree/main/evm).
::::

```typescript
// wagmiConfig.ts
import { createConfig } from "wagmi";
import { coinbaseWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { createClient, http } from "viem";
import { mainnet } from "viem/chains";

const bitcodex = toBitcodeX({
  api_key: "YOUR_API_KEY",
  theme: "dark",
});

export const config = createConfig({
  chains: [mainnet],
  connectors: connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [bitcodex],
      },
      {
        groupName: "Other Wallets",
        wallets: [metaMaskWallet, coinbaseWallet],
      },
    ],
    {
      appName: "Your App Name",
      projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
    },
  ),
  client({ chain }) {
    return createClient({ chain, transport: http() });
  },
});
```

## Step 3: Setup Providers

### Create Provider Component

```typescript
// providers.ts
import React from "react";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "./wagmiConfig";

const queryClient = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
```

## Next Steps

- **[SDK Overview](./sdk-overview)** - Back to basics
- **[Cosmos Integration](./cosmos-integration)** - Cosmos patterns
- **[Ethereum Integration](./ethereum-integration)** - Ethereum patterns
- **[React Integration](./react-integration)** - React patterns
- **[Error Handling](./error-handling)** - Error handling patterns
