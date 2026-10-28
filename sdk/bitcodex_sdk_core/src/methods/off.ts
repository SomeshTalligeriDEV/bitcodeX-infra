import type {
  BitcodeXWalletCoreEventHandler2,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";

export function off(
  this: BitcodeXWalletWebInterface,
  handlerDef: BitcodeXWalletCoreEventHandler2,
) {
  this.eventEmitter.off(handlerDef);
}
