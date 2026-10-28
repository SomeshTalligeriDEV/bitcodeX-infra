import type { BitcodeXBittensorWallet } from "@bitcodex/sdk-bittensor";
import { useContext } from "react";

import { BittensorContext } from "./context";

export interface UseBitcodeXBittensorReturn {
  bittensorWallet: BitcodeXBittensorWallet | null;
  isInitialized: boolean;
  isReady: boolean;
  address: string | null;
}

export function useBitcodeXBittensor(): UseBitcodeXBittensorReturn {
  const ctx = useContext(BittensorContext);

  return {
    bittensorWallet: ctx.instance,
    isInitialized: ctx.isInitialized,
    isReady: ctx.isReady,
    address: ctx.address,
  };
}
