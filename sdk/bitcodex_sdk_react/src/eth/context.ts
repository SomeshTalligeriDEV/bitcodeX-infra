import type { BitcodeXEthWalletInterface } from "@bitcodex/bitcodex-sdk-eth";
import { createContext } from "react";

export interface EthContextValue {
  instance: BitcodeXEthWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
  address: string | null;
}

export const EthContext = createContext<EthContextValue>({
  instance: null,
  isInitialized: false,
  isReady: false,
  address: null,
});
