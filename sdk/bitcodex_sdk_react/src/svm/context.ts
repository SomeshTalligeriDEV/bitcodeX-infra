import type { BitcodeXSvmWalletInterface } from "@bitcodex/bitcodex-sdk-svm";
import { createContext } from "react";

export interface SvmContextValue {
  instance: BitcodeXSvmWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
  address: string | null;
}

export const SvmContext = createContext<SvmContextValue>({
  instance: null,
  isInitialized: false,
  isReady: false,
  address: null,
});
