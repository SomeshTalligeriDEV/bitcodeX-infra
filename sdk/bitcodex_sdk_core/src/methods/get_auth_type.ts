import type { AuthType } from "@bitcodex/bitcodex-types/auth";

import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

export async function getAuthType(
  this: BitcodeXWalletWebInterface,
): Promise<AuthType | null> {
  await this.waitUntilInitialized;

  const res = await this.sendMsgToIframe({
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "get_auth_type",
    payload: null,
  });

  if (res.msg_type === "get_auth_type_ack" && res.payload.success) {
    return res.payload.data;
  }

  return null;
}
