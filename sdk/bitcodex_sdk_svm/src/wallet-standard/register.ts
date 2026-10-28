import { registerWallet } from "@wallet-standard/wallet";

import type { WalletStandardConfig } from "./chains";
import { BitcodeXStandardWallet } from "./wallet";
import type { BitcodeXSvmWalletInterface } from "@bitcodex-sdk-svm/types";

const state = { isRegistered: false };

export function registerWalletStandard(
  wallet: BitcodeXSvmWalletInterface,
  configs: WalletStandardConfig[],
): void {
  if (state.isRegistered) {
    console.warn("[bitcodex-svm] Wallet-standard already registered.");
    return;
  }

  const standardWallet = new BitcodeXStandardWallet(wallet, configs);
  registerWallet(standardWallet);

  state.isRegistered = true;
}
