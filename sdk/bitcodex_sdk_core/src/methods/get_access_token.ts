import type { BitcodeXWalletWebInterface } from "@bitcodex-sdk-core/types";
import { BITCODEX_ATTACHED_TARGET } from "@bitcodex-sdk-core/window_msg/target";

/**
 * A short-lived access token (EdDSA JWT, 1 hour) proving to YOUR backend which BitcodeX
 * user is signed in. Verify it server-side with `verifyAccessToken` from @bitcodex/server.
 * Returns null when signed out.
 */
export async function getAccessToken(
  this: BitcodeXWalletWebInterface,
): Promise<string | null> {
  await this.waitUntilInitialized;
  const res = await this.sendMsgToIframe({
    target: BITCODEX_ATTACHED_TARGET,
    msg_type: "get_access_token",
    payload: null,
  });
  if (res.msg_type === "get_access_token_ack" && res.payload.success) {
    return res.payload.data.access_token;
  }
  return null;
}
