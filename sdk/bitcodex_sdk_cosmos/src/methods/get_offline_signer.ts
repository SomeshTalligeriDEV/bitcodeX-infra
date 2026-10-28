import type { OfflineDirectSigner } from "@cosmjs/proto-signing";
import type { KeplrSignOptions } from "@keplr-wallet/types";

import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export function getOfflineSigner(
  this: BitcodeXCosmosWalletInterface,
  chainId: string,
  signOptions?: KeplrSignOptions,
): OfflineDirectSigner {
  return {
    getAccounts: this.getAccounts.bind(this),
    signDirect: (signerAddress, signDoc) =>
      this.signDirect(chainId, signerAddress, signDoc, signOptions),
  };
}
