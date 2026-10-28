import { BitcodeXMainWallet } from "./main-wallet";
import { bitcodexWalletInfo } from "./registry";
import type { BitcodeXWalletOptions } from "./types";

export const makeBitcodeXWallet = (
  options: BitcodeXWalletOptions,
): BitcodeXMainWallet => {
  return new BitcodeXMainWallet({
    ...bitcodexWalletInfo,
    options,
  });
};

export { BitcodeXChainWallet } from "./chain-wallet";
export { BitcodeXWalletClient } from "./client";
export { BitcodeXMainWallet } from "./main-wallet";
export { bitcodexWalletInfo } from "./registry";
export type { BitcodeXWalletOptions } from "./types";
