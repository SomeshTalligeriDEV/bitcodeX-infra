import type { BitcodeXWalletMsgGetNameAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetName(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const wallet = useAppState.getState().getWallet(storageKey);

  let payload: BitcodeXWalletMsgGetNameAck["payload"];
  if (wallet?.name) {
    payload = {
      success: true,
      data: wallet.name,
    };
  } else {
    payload = {
      success: false,
      err: "No name found",
    };
  }

  const ack: BitcodeXWalletMsgGetNameAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_name_ack",
    payload,
  };
  port.postMessage(ack);
}
