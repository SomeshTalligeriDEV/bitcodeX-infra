import type { BitcodeXWalletMsgGetAccessTokenAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { BITCODEX_API_ENDPOINT } from "@bitcodex-attached/requests/endpoints";
import { useAppState } from "@bitcodex-attached/store/app";
import { useMemoryState } from "@bitcodex-attached/store/memory";

/** Exchange this origin's BitcodeX session for an app access token (X10). */
export async function handleGetAccessToken(ctx: MsgEventContext) {
  const reply = (payload: BitcodeXWalletMsgGetAccessTokenAck["payload"]) => {
    const ack: BitcodeXWalletMsgGetAccessTokenAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "get_access_token_ack",
      payload,
    };
    ctx.port.postMessage(ack);
  };
  const session = useAppState.getState().getAuthToken(ctx.storageKey);
  const apiKey = useMemoryState.getState().apiKey;
  if (!session || !apiKey) {
    reply({ success: false, err: "not signed in" });
    return;
  }
  try {
    const res = await fetch(`${BITCODEX_API_ENDPOINT}/access_token/v1`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session}`, "x-api-key": apiKey },
    });
    const body = await res.json();
    if (!body.success) {
      reply({ success: false, err: body.msg ?? `HTTP ${res.status}` });
      return;
    }
    reply({ success: true, data: body.data });
  } catch (err) {
    reply({
      success: false,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
