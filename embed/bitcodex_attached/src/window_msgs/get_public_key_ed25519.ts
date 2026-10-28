import type { BitcodeXWalletMsgGetPublicKeyEd25519Ack } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetPublicKeyEd25519(ctx: MsgEventContext) {
  const { port, storageKey } = ctx;
  const walletEd25519 = useAppState.getState().getWalletEd25519(storageKey);

  let payload: BitcodeXWalletMsgGetPublicKeyEd25519Ack["payload"];
  if (walletEd25519?.publicKey) {
    payload = {
      success: true,
      data: walletEd25519.publicKey,
    };
  } else {
    payload = {
      success: false,
      err: "No Ed25519 public key found",
    };
  }

  const ack: BitcodeXWalletMsgGetPublicKeyEd25519Ack = {
    target: BITCODEX_SDK_TARGET,
    msg_type: "get_public_key_ed25519_ack",
    payload,
  };

  port.postMessage(ack);
}
