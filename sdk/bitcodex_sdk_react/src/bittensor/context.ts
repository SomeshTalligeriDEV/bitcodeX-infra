import type { BitcodeXBittensorWallet } from "@bitcodex/sdk-bittensor";
import { createContext } from "react";

export interface BittensorContextValue {
  instance: BitcodeXBittensorWallet | null;
  isInitialized: boolean;
  isReady: boolean;
  /** SS58 coldkey address, or null when signed out. */
  address: string | null;
}

export const BittensorContext = createContext<BittensorContextValue>({
  instance: null,
  isInitialized: false,
  isReady: false,
  address: null,
});
