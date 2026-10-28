import type { BitcodeXSvmWalletInterface } from "@bitcodex/bitcodex-sdk-svm";
import { useContext } from "react";

import { SvmContext } from "./context";

export interface UseBitcodeXSvmReturn {
  svmWallet: BitcodeXSvmWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
  address: string | null;
}

export function useBitcodeXSvm(): UseBitcodeXSvmReturn {
  const ctx = useContext(SvmContext);

  return {
    svmWallet: ctx.instance,
    isInitialized: ctx.isInitialized,
    isReady: ctx.isReady,
    address: ctx.address,
  };
}
