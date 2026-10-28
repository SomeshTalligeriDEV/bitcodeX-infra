import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

export async function getPublicKey(
  this: BitcodeXWalletWebInterface,
): Promise<string | null> {
  await this.waitUntilInitialized;

  const res = await this.sendMsgToIframe({
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "get_public_key",
    payload: null,
  });

  if (res.msg_type === "get_public_key_ack" && res.payload.success) {
    return res.payload.data;
  }

  return null;
}
