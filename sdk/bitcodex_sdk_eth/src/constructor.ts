import type { BitcodeXWalletInterface } from "@bitcodex/bitcodex-sdk-core";

import { lazyInit } from "./private/lazy_init";
import type {
  BitcodeXEthWalletInterface,
  BitcodeXEthWalletStaticInterface,
} from "./types";

export const BitcodeXEthWallet = function (
  this: BitcodeXEthWalletInterface,
  bitcodexWallet: BitcodeXWalletInterface,
) {
  this.bitcodexWallet = bitcodexWallet;
  this.provider = null;
  this.state = {
    publicKey: null,
    publicKeyRaw: null,
    address: null,
  };
  this.waitUntilInitialized = lazyInit(this).then();
} as unknown as BitcodeXEthWalletStaticInterface;
