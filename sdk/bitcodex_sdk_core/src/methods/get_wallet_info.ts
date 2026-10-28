import type {
  BitcodeXWalletWebInterface,
  WalletInfo,
} from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

export async function getWalletInfo(
  this: BitcodeXWalletWebInterface,
): Promise<WalletInfo | null> {
  await this.waitUntilInitialized;

  const res = await this.sendMsgToIframe({
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "get_wallet_info",
    payload: null,
  });

  if (res.msg_type === "get_wallet_info_ack" && res.payload.success) {
    return res.payload.data;
  }

  return null;
}
