import type { BitcodeXWalletMsgSignOutAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { errorToLog } from "@bitcodex-attached/logging/error";
import { postLog } from "@bitcodex-attached/requests/logging";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleSignOut(ctx: MsgEventContext): Promise<void> {
  const { port, storageKey } = ctx;

  try {
    useAppState.getState().resetAll(storageKey);
    console.log("[attached] signed out");

    const ack: BitcodeXWalletMsgSignOutAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "sign_out_ack",
      payload: {
        success: true,
        data: null,
      },
    };

    port.postMessage(ack);
  } catch (error: any) {
    postLog(
      {
        level: "error",
        message: "[attached] signout error",
        error: errorToLog(error),
      },
      { console: true },
    );

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const ack: BitcodeXWalletMsgSignOutAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "sign_out_ack",
      payload: {
        success: false,
        err: errorMessage,
      },
    };

    port.postMessage(ack);
  }
}
