import type { BitcodeXCosmosWalletInterface } from "@bitcodex/bitcodex-sdk-cosmos";
import { createContext } from "react";

export interface CosmosContextValue {
  instance: BitcodeXCosmosWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
}

export const CosmosContext = createContext<CosmosContextValue>({
  instance: null,
  isInitialized: false,
  isReady: false,
});
