import type { BitcodeXCosmosWalletInterface } from "@bitcodex/bitcodex-sdk-cosmos";
import { useContext } from "react";

import { CosmosContext } from "./context";

export interface UseBitcodeXCosmosReturn {
  cosmosWallet: BitcodeXCosmosWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
}

export function useBitcodeXCosmos(): UseBitcodeXCosmosReturn {
  const ctx = useContext(CosmosContext);

  return {
    cosmosWallet: ctx.instance,
    isInitialized: ctx.isInitialized,
    isReady: ctx.isReady,
  };
}
