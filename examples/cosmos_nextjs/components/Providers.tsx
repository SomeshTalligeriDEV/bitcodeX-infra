"use client";

import {
  BitcodeXProvider,
  type BitcodeXProviderConfig,
} from "@bitcodex/bitcodex-sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

const queryClient = new QueryClient();

const bitcodexConfig: BitcodeXProviderConfig = {
  apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY ?? "",
  sdkEndpoint: process.env.NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT,
  cosmos: true,
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <BitcodeXProvider config={bitcodexConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BitcodeXProvider>
  );
}
