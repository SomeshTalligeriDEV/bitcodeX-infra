import type React from "react";
import { createContext, useMemo } from "react";

import {
  BitcodeXWalletRN,
  type BitcodeXWalletRNConfig,
} from "./BitcodeXWalletRN";

export const BitcodeXWalletContext = createContext<BitcodeXWalletRN | null>(
  null,
);

export interface BitcodeXWalletProviderProps {
  /** BitcodeX API key */
  apiKey: string;
  /** Mobile host endpoint for OS browser flows (e.g. http://localhost:3207) */
  sdkEndpoint?: string;
  /** Deep link scheme for OAuth callbacks (default: "bitcodexwallet") */
  redirectScheme?: string;
  /** Android-only callback scheme for BitcodeXAuthCallbackActivity (default: "bitcodex.auth.callback").
   *  Must match `callbackScheme` in the Expo config plugin (or your AndroidManifest intent-filter). */
  androidCallbackScheme?: string;
  children: React.ReactNode;
}

export function BitcodeXWalletProvider({
  apiKey,
  sdkEndpoint,
  redirectScheme,
  androidCallbackScheme,
  children,
}: BitcodeXWalletProviderProps) {
  const wallet = useMemo(() => {
    const config: BitcodeXWalletRNConfig = {
      apiKey,
      sdkEndpoint,
      redirectScheme,
      androidCallbackScheme,
    };
    return new BitcodeXWalletRN(config);
  }, [apiKey, sdkEndpoint, redirectScheme, androidCallbackScheme]);

  return (
    <BitcodeXWalletContext.Provider value={wallet}>
      {children}
    </BitcodeXWalletContext.Provider>
  );
}
