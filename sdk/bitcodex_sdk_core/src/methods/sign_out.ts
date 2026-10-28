import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

export async function signOut(this: BitcodeXWalletWebInterface) {
  await this.waitUntilInitialized;

  await this.sendMsgToIframe({
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "sign_out",
    payload: null,
  });

  this.state = {
    authType: null,
    email: null,
    publicKey: null,
    name: null,
  };

  this.eventEmitter.emit({
    type: "CORE__accountsChanged",
    authType: null,
    email: null,
    publicKey: null,
    name: null,
  });
}
