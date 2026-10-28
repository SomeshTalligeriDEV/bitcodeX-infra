import type { BitcodeXCosmosWalletInterface } from "@bitcodex/bitcodex-sdk-cosmos";
import { BitcodeXCosmosWallet } from "@bitcodex/bitcodex-sdk-cosmos";

import type { BitcodeXWalletOptions } from "./types";

export function initializeBitcodeXCosmosWallet(
  options: BitcodeXWalletOptions,
): BitcodeXCosmosWalletInterface {
  const cosmosWalletResult = BitcodeXCosmosWallet.init({
    api_key: options.apiKey,
    sdk_endpoint: options.sdkEndpoint,
  });

  if (!cosmosWalletResult.success) {
    throw new Error(
      `Failed to initialize BitcodeXCosmosWallet: ${
        (cosmosWalletResult as any).err?.msg || "Unknown error"
      }`,
    );
  }

  return cosmosWalletResult.data;
}
