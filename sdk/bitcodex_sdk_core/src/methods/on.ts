import type {
  BitcodeXWalletCoreEventHandler2,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";

export function on(
  this: BitcodeXWalletWebInterface,
  handlerDef: BitcodeXWalletCoreEventHandler2,
) {
  this.eventEmitter.on(handlerDef);
}
