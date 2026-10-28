"use client";

import { makeBitcodeXWallet } from "@bitcodex/bitcodex-cosmos-kit";
import { ChainProvider } from "@cosmos-kit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { assets, chains } from "chain-registry";

import App from "@/components/App";
import "@interchain-ui/react/styles";

const queryClient = new QueryClient();

export default function Home() {
  const bitcodexWallet = makeBitcodeXWallet({
    apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
  });
  return (
    <QueryClientProvider client={queryClient}>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[bitcodexWallet]}
        throwErrors={false}
      >
        <App />
      </ChainProvider>
    </QueryClientProvider>
  );
}
