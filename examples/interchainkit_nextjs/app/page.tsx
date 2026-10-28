"use client";

import { makeBitcodeXWallet } from "@bitcodex/bitcodex-interchain-kit";
import { assetLists, chains } from "@chain-registry/v2";
import { ChainProvider, InterchainWalletModal } from "@interchain-kit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "@/components/App";
import "@interchain-kit/react/styles.css";

const queryClient = new QueryClient();

// Filter chains to only include osmosis testnet for testing
const filteredChains = chains.filter(
  (chain) => chain.chainName === "osmosistestnet",
);
const filteredAssetLists = assetLists.filter(
  (assetList) => assetList.chainName === "osmosistestnet",
);

export default function Home() {
  const bitcodexWallet =
    typeof window !== "undefined"
      ? makeBitcodeXWallet({
          apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
          sdkEndpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT,
        })
      : null;

  return (
    <QueryClientProvider client={queryClient}>
      <ChainProvider
        chains={filteredChains}
        assetLists={filteredAssetLists}
        wallets={bitcodexWallet ? [bitcodexWallet] : []}
        walletModal={() => <InterchainWalletModal />}
      >
        <App />
      </ChainProvider>
    </QueryClientProvider>
  );
}
