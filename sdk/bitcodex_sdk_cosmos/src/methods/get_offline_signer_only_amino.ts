import type { OfflineAminoSigner } from "@cosmjs/amino";
import type { KeplrSignOptions } from "@keplr-wallet/types";

import type { BitcodeXCosmosWalletInterface } from "@bitcodex-sdk-cosmos/types";

export function getOfflineSignerOnlyAmino(
  this: BitcodeXCosmosWalletInterface,
  chainId: string,
  signOptions?: KeplrSignOptions,
): OfflineAminoSigner {
  return {
    getAccounts: this.getAccounts.bind(this),
    signAmino: (signerAddress, signDoc) =>
      this.signAmino(chainId, signerAddress, signDoc, signOptions),
  };
}
