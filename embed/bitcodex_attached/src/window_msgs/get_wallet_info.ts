import type { BitcodeXWalletMsgGetWalletInfoAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetWalletInfo(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const wallet = useAppState.getState().getWallet(storageKey);

  let payload: BitcodeXWalletMsgGetWalletInfoAck["payload"];
  if (wallet) {
    payload = {
      success: true,
      data: {
        authType: wallet.authType,
        publicKey: wallet.publicKey,
        email: wallet.email ?? null,
        name: wallet.name ?? null,
      },
    };
  } else {
    payload = {
      success: false,
      err: "No wallet found",
    };
  }

  const ack: BitcodeXWalletMsgGetWalletInfoAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_wallet_info_ack",
    payload,
  };
  port.postMessage(ack);
}
