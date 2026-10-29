import type {
  BitcodeXWalletMsgOpenModal,
  BitcodeXWalletMsgOpenModalAck,
  MakeBittensorSigData,
} from "@bitcodex/bitcodex-sdk-core";

import { appNetwork, isOriginAllowed } from "./app_config";
import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { BITTENSOR_ALLOWED_HOST_ORIGINS } from "@bitcodex-attached/requests/endpoints";
import { useMemoryState } from "@bitcodex-attached/store/memory";

export async function handleOpenModal(
  ctx: MsgEventContext,
  msg: BitcodeXWalletMsgOpenModal,
) {
  const { port } = ctx;

  // Bittensor: show the real requesting origin (postMessage event.origin), not the
  // origin field the host wrote into the payload.
  const payload = msg.payload;
  // App allowed origins (developer dashboard, X11) apply to every modal.
  const app = await isOriginAllowed(ctx.hostOrigin);
  if (!app.allowed && payload) {
    const ack = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "open_modal_ack",
      payload: {
        modal_type: payload.modal_type,
        modal_id: payload.modal_id,
        type: "error",
        error: { type: "origin_not_allowed", error: app.reason },
      },
    } as unknown as BitcodeXWalletMsgOpenModalAck;
    port.postMessage(ack);
    return;
  }
  // The app's network (dashboard setting) must match the requested chain.
  if (payload?.modal_type === "bittensor/make_signature") {
    const network = await appNetwork();
    const requested = payload.data.payload.chain_id;
    if (network && network !== requested) {
      const ack: BitcodeXWalletMsgOpenModalAck = {
        target: BITCODEX_SDK_TARGET,
        msg_type: "open_modal_ack",
        payload: {
          modal_type: "bittensor/make_signature",
          modal_id: payload.modal_id,
          type: "error",
          error: {
            type: "network_refused",
            error: `this app is set to ${network} in the developer dashboard, not ${requested}`,
          },
        },
      };
      port.postMessage(ack);
      return;
    }
  }
  if (
    payload?.modal_type === "bittensor/make_signature" &&
    !isAllowedBittensorOrigin(ctx.hostOrigin)
  ) {
    const ack: BitcodeXWalletMsgOpenModalAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "open_modal_ack",
      payload: {
        modal_type: "bittensor/make_signature",
        modal_id: payload.modal_id,
        type: "error",
        error: {
          type: "origin_not_allowed",
          error: `${ctx.hostOrigin} is not allowed to request signatures`,
        },
      },
    };
    port.postMessage(ack);
    return;
  }
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

export function isAllowedBittensorOrigin(origin: string): boolean {
  return (
    BITTENSOR_ALLOWED_HOST_ORIGINS.length === 0 ||
    BITTENSOR_ALLOWED_HOST_ORIGINS.includes(origin)
  );
}
