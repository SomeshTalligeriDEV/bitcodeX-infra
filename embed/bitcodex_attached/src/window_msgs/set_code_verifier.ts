import type {
  BitcodeXWalletMsgSetCodeVerifier,
  BitcodeXWalletMsgSetCodeVerifierAck,
} from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export function handleSetCodeVerifier(
  ctx: MsgEventContext,
  message: BitcodeXWalletMsgSetCodeVerifier,
) {
  const { port, storageKey } = ctx;

  if (!message.payload) {
    throw new Error("Code verifier is empty");
  }

  const appState = useAppState.getState();
  appState.setCodeVerifier(storageKey, message.payload);

  const ack: BitcodeXWalletMsgSetCodeVerifierAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "set_code_verifier_ack",
    payload: {
      success: true,
      data: null,
    },
  };

  port.postMessage(ack);
}
