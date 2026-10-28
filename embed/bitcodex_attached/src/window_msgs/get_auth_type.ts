import type { BitcodeXWalletMsgGetAuthTypeAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetAuthType(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const wallet = useAppState.getState().getWallet(storageKey);

  let payload: BitcodeXWalletMsgGetAuthTypeAck["payload"];
  if (wallet?.authType) {
    payload = {
      success: true,
      data: wallet.authType,
    };
  } else {
    payload = {
      success: false,
      err: "No auth type found",
    };
  }

  const ack: BitcodeXWalletMsgGetAuthTypeAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_auth_type_ack",
    payload,
  };

  port.postMessage(ack);
}
