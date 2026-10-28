import type { BitcodeXWalletMsgGetEmailAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetEmail(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const wallet = useAppState.getState().getWallet(storageKey);

  let payload: BitcodeXWalletMsgGetEmailAck["payload"];
  if (wallet?.email) {
    payload = {
      success: true,
      data: wallet.email,
    };
  } else {
    payload = {
      success: false,
      err: "No email found",
    };
  }

  const ack: BitcodeXWalletMsgGetEmailAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_email_ack",
    payload,
  };
  port.postMessage(ack);
}
