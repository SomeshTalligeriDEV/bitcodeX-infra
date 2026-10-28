import {
  type BitcodeXWalletInterface,
  EventEmitter3,
} from "@bitcodex/bitcodex-sdk-core";

import { lazyInit } from "./private/lazy_init";
import type {
  BitcodeXCosmosWalletEvent2,
  BitcodeXCosmosWalletEventHandler2,
  BitcodeXCosmosWalletInterface,
  BitcodeXCosmosWalletStaticInterface,
} from "@bitcodex-sdk-cosmos/types";

export const BitcodeXCosmosWallet = function (
  this: BitcodeXCosmosWalletInterface,
  bitcodexWallet: BitcodeXWalletInterface,
) {
  this.bitcodexWallet = bitcodexWallet;
  this.eventEmitter = new EventEmitter3<
    BitcodeXCosmosWalletEvent2,
    BitcodeXCosmosWalletEventHandler2
  >();
  this.state = {
    publicKey: null,
    publicKeyRaw: null,
  };
  this.waitUntilInitialized = lazyInit(this).then();
} as unknown as BitcodeXCosmosWalletStaticInterface;
