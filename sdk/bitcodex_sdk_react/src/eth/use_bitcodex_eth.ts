import type { BitcodeXEthWalletInterface } from "@bitcodex/bitcodex-sdk-eth";
import { useContext } from "react";

import { EthContext } from "./context";

export interface UseBitcodeXEthReturn {
  ethWallet: BitcodeXEthWalletInterface | null;
  isInitialized: boolean;
  isReady: boolean;
  address: string | null;
}

export function useBitcodeXEth(): UseBitcodeXEthReturn {
  const ctx = useContext(EthContext);

  return {
    ethWallet: ctx.instance,
    isInitialized: ctx.isInitialized,
    isReady: ctx.isReady,
    address: ctx.address,
  };
}
