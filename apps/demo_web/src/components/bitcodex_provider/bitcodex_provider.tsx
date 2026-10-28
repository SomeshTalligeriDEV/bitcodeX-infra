"use client";

import { BitcodeXProvider as BitcodeXSDKProvider } from "@bitcodex/bitcodex-sdk-react";
import type { FC, PropsWithChildren } from "react";

import { useThemeSync } from "@bitcodex-demo-web/hooks/use_theme_sync";

const bitcodexConfig = {
  apiKey: "72bd2afd04374f86d563a40b814b7098e5ad6c7f52d3b8f84ab0c3d05f73ac6c",
  sdkEndpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT,
  eth: true as const,
  cosmos: true as const,
  svm: { chainId: "solana:devnet" },
  bittensor: { chainId: "bittensor:localnet" as const },
};

const InnerProvider: FC<PropsWithChildren> = ({ children }) => {
  useThemeSync();

  return <>{children}</>;
};

export const BitcodeXProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <BitcodeXSDKProvider config={bitcodexConfig}>
      <InnerProvider>{children}</InnerProvider>
    </BitcodeXSDKProvider>
  );
};
