import type {
  BitcodeXWalletMsgWalletLogin,
  BitcodeXWalletMsgWalletLoginAck,
} from "@bitcodex/bitcodex-sdk-core";

import { isOriginAllowed } from "./app_config";
import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { BITCODEX_API_ENDPOINT } from "@bitcodex-attached/requests/endpoints";
import { useAppState } from "@bitcodex-attached/store/app";
import { useMemoryState } from "@bitcodex-attached/store/memory";

const ACTIONS = new Set(["nonce", "verify", "link"]);

/** Forward a wallet-login call (X04) to the API with this app's key (and session for link). */
export async function handleWalletLogin(
  ctx: MsgEventContext,
  msg: BitcodeXWalletMsgWalletLogin,
) {
  const reply = (payload: BitcodeXWalletMsgWalletLoginAck["payload"]) => {
    const ack: BitcodeXWalletMsgWalletLoginAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "wallet_login_ack",
      payload,
    };
    ctx.port.postMessage(ack);
  };
  const { action, body } = msg.payload ?? {};
  if (!ACTIONS.has(action)) {
    reply({ success: false, err: "unknown wallet login action" });
    return;
  }
  const allowed = await isOriginAllowed(ctx.hostOrigin);
  if (!allowed.allowed) {
    reply({ success: false, err: allowed.reason ?? "origin not allowed" });
    return;
  }
  const apiKey = useMemoryState.getState().apiKey as string;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": apiKey,
  };
  if (action === "link") {
    const session = useAppState.getState().getAuthToken(ctx.storageKey);
    if (!session) {
      reply({ success: false, err: "sign in with BitcodeX first" });
      return;
    }
    headers.Authorization = `Bearer ${session}`;
  }
  try {
    const res = await fetch(
      `${BITCODEX_API_ENDPOINT}/wallet_login/v1/${action}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body ?? {}),
      },
    );
    const data = await res.json();
    reply(
      data.success
        ? { success: true, data: data.data }
        : { success: false, err: data.msg ?? `HTTP ${res.status}` },
    );
  } catch (err) {
    reply({
      success: false,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
