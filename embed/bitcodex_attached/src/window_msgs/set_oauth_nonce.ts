import type {
  BitcodeXWalletMsgSetOAuthNonce,
  BitcodeXWalletMsgSetOAuthNonceAck,
} from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export function handleSetOAuthNonce(
  ctx: MsgEventContext,
  message: BitcodeXWalletMsgSetOAuthNonce,
) {
  const { port, storageKey } = ctx;

  if (!message.payload) {
    throw new Error("Nonce is empty");
  }

  const appState = useAppState.getState();
  appState.setNonce(storageKey, message.payload);

  const ack: BitcodeXWalletMsgSetOAuthNonceAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "set_oauth_nonce_ack",
    payload: {
      success: true,
      data: null,
    },
  };

  port.postMessage(ack);
}
