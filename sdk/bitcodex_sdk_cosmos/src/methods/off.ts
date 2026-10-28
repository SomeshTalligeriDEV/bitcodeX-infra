import type {
  BitcodeXCosmosWalletEventHandler2,
  BitcodeXCosmosWalletInterface,
} from "@bitcodex-sdk-cosmos/types";

export function off(
  this: BitcodeXCosmosWalletInterface,
  handlerDef: BitcodeXCosmosWalletEventHandler2,
) {
  this.eventEmitter.off(handlerDef);
}
