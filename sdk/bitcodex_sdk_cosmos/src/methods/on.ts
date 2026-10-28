import type {
  BitcodeXCosmosWalletEventHandler2,
  BitcodeXCosmosWalletInterface,
} from "@bitcodex-sdk-cosmos/types";

export function on(
  this: BitcodeXCosmosWalletInterface,
  handlerDef: BitcodeXCosmosWalletEventHandler2,
) {
  this.eventEmitter.on(handlerDef);
}
