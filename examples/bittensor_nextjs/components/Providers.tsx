"use client";

import {
  BitcodeXProvider,
  type BitcodeXProviderConfig,
} from "@bitcodex/bitcodex-sdk-react";
import type React from "react";

const bitcodexConfig: BitcodeXProviderConfig = {
  apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY ?? "",
  sdkEndpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT,
  bittensor: { chainId: "bittensor:localnet" },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BitcodeXProvider config={bitcodexConfig}>{children}</BitcodeXProvider>
  );
}
