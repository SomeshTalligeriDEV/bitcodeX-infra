import { BitcodeXWallet } from "./bitcodex-wallet";
import { initializeBitcodeXCosmosWallet } from "./init";
import { bitcodexWalletInfo } from "./registry";
import type { BitcodeXWalletOptions } from "./types";

export const makeBitcodeXWallet = (
  options: BitcodeXWalletOptions,
): BitcodeXWallet => {
  if (typeof window === "undefined") {
    throw new Error(
      "BitcodeX Wallet can only be initialized in browser environment",
    );
  }

  const bitcodexClient = initializeBitcodeXCosmosWallet(options);
  return new BitcodeXWallet(bitcodexWalletInfo, bitcodexClient);
};

export { bitcodexWalletInfo } from "./registry";
export type { BitcodeXWalletOptions } from "./types";
