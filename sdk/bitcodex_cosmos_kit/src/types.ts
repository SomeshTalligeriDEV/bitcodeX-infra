import type { Wallet } from "@cosmos-kit/core";

export interface BitcodeXWalletOptions {
  apiKey: string;
  sdkEndpoint?: string;
}

export type BitcodeXWalletInfo = Wallet & { options: BitcodeXWalletOptions };
