import type {
  BitcodeXWalletMsgOAuthInfoPass,
  BitcodeXWalletMsgOAuthSignInUpdate,
  OAuthSignInError,
} from "@bitcodex/bitcodex-sdk-core";

import { postLog } from "@bitcodex-attached/requests/logging";
import { sendMsgToWindow } from "@bitcodex-attached/window_msgs/send";
import { BITCODEX_SDK_TARGET } from "@bitcodex-attached/window_msgs/target";

export async function bail(
  message: BitcodeXWalletMsgOAuthInfoPass,
  err: OAuthSignInError,
) {
  postLog(
    {
      level: "error",
      message: "[attached] handling oauth sign-in fail",
      error: {
        name: "oauth_sign_in_error",
        message: JSON.stringify(err),
      },
    },
    { console: true },
  );

  const updateMsg: BitcodeXWalletMsgOAuthSignInUpdate = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "oauth_sign_in_update",
    payload: { success: false, err },
  };

  const hostOrigin = message.payload.target_origin;
  await sendMsgToWindow(window.parent, updateMsg, hostOrigin);
}
