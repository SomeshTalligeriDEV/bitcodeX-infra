import type {
  BitcodeXWalletMsgMfa,
  BitcodeXWalletMsgMfaAck,
} from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import {
  BITCODEX_API_ENDPOINT,
  USER_DASHBOARD_ORIGINS,
} from "@bitcodex-attached/requests/endpoints";
import { useAppState } from "@bitcodex-attached/store/app";

const PATHS: Record<string, string> = {
  status: "status",
  enroll: "totp/enroll",
  confirm: "totp/confirm",
  threshold: "threshold",
  disable: "disable",
};

/** MFA settings (X12). Only the user dashboard may change them, never a third-party app. */
export async function handleMfa(
  ctx: MsgEventContext,
  msg: BitcodeXWalletMsgMfa,
) {
  const reply = (payload: BitcodeXWalletMsgMfaAck["payload"]) => {
    const ack: BitcodeXWalletMsgMfaAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "mfa_ack",
      payload,
    };
    ctx.port.postMessage(ack);
  };
  const allowed = (USER_DASHBOARD_ORIGINS ?? "")
    .split(",")
    .map((o: string) => o.trim());
  if (!allowed.includes(ctx.hostOrigin)) {
    reply({
      success: false,
      err: "MFA settings can only be changed in the BitcodeX dashboard",
    });
    return;
  }
  const path = PATHS[msg.payload?.action];
  if (!path) {
    reply({ success: false, err: "unknown MFA action" });
    return;
  }
  const session = useAppState.getState().getAuthToken(ctx.storageKey);
  if (!session) {
    reply({ success: false, err: "not signed in" });
    return;
  }
  try {
    const res = await fetch(`${BITCODEX_API_ENDPOINT}/mfa/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(msg.payload.body ?? {}),
    });
    const body = await res.json();
    reply(
      body.success
        ? { success: true, data: body.data }
        : { success: false, err: body.msg ?? `HTTP ${res.status}` },
    );
  } catch (err) {
    reply({
      success: false,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}
