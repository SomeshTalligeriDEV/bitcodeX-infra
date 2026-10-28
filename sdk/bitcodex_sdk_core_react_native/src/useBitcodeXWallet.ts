import { useContext } from "react";

import { BitcodeXWalletContext } from "./BitcodeXWalletProvider";
import type { BitcodeXWalletRN } from "./BitcodeXWalletRN";

export function useBitcodeXWallet(): BitcodeXWalletRN {
  const wallet = useContext(BitcodeXWalletContext);

  if (!wallet) {
    throw new Error(
      "[bitcodex-rn] useBitcodeXWallet must be used within an BitcodeXWalletProvider",
    );
  }

  return wallet;
}
