import type { BitcodeXWalletMsgGetPublicKeyAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetPublicKey(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const wallet = useAppState.getState().getWallet(storageKey);

  let payload: BitcodeXWalletMsgGetPublicKeyAck["payload"];
  if (wallet?.publicKey) {
    payload = {
      success: true,
      data: wallet.publicKey,
    };
  } else {
    payload = {
      success: false,
      err: "No public key found",
    };
  }

  const ack: BitcodeXWalletMsgGetPublicKeyAck = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_public_key_ack",
    payload,
  };

  port.postMessage(ack);
}
