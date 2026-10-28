import type {
  BitcodeXWalletMsgOpenModal,
  MakeBittensorSigData,
} from "@bitcodex/bitcodex-sdk-core";

import type { MsgEventContext } from "./types";
import { useMemoryState } from "@bitcodex-attached/store/memory";

export async function handleOpenModal(
  ctx: MsgEventContext,
  msg: BitcodeXWalletMsgOpenModal,
) {
  const { port } = ctx;

  // Bittensor: show the real requesting origin (postMessage event.origin), not the
  // origin field the host wrote into the payload.
  const payload = msg.payload;
  const verifiedMsg: BitcodeXWalletMsgOpenModal =
    payload?.modal_type === "bittensor/make_signature"
      ? {
          ...msg,
          payload: {
            ...payload,
            data: withVerifiedOrigin(payload.data, ctx.hostOrigin),
          },
        }
      : msg;

  useMemoryState.getState().clearError();
  useMemoryState.getState().openModal({ port, msg: verifiedMsg });
}

function withVerifiedOrigin(
  data: MakeBittensorSigData,
  origin: string,
): MakeBittensorSigData {
  switch (data.sign_type) {
    case "extrinsic":
      return { ...data, payload: { ...data.payload, origin } };
    case "raw":
      return { ...data, payload: { ...data.payload, origin } };
  }
}
