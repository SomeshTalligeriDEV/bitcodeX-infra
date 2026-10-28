import type { BitcodeXWalletMsgGetConnectedAppsAck } from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import {
  BITCODEX_API_ENDPOINT,
  USER_DASHBOARD_ORIGINS,
} from "@bitcodex-attached/requests/endpoints";
import { useAppState } from "@bitcodex-attached/store/app";

export async function handleGetConnectedApps(
  ctx: MsgEventContext,
): Promise<void> {
  const { port, hostOrigin, storageKey } = ctx;

  const allowedOrigins = USER_DASHBOARD_ORIGINS.split(",").map((o: string) =>
    o.trim(),
  );
  if (!allowedOrigins.includes(hostOrigin)) {
    const ack: BitcodeXWalletMsgGetConnectedAppsAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "__get_connected_apps_ack__",
      payload: { success: false, error: { type: "UNAUTHORIZED_ORIGIN" } },
    };
    port.postMessage(ack);
    return;
  }

  const authToken = useAppState.getState().getAuthToken(storageKey);
  if (!authToken) {
    const ack: BitcodeXWalletMsgGetConnectedAppsAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "__get_connected_apps_ack__",
      payload: { success: false, error: { type: "NOT_AUTHENTICATED" } },
    };
    port.postMessage(ack);
    return;
  }

  try {
    const response = await fetch(
      `${BITCODEX_API_ENDPOINT}/user_dashboard/v1/get_connected_apps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      const ack: BitcodeXWalletMsgGetConnectedAppsAck = {
        target: BITCODEX_SDK_TARGET,
        msg_type: "__get_connected_apps_ack__",
        payload: {
          success: false,
          error: {
            type: "FETCH_ERROR",
            error: `HTTP ${response.status}`,
          },
        },
      };
      port.postMessage(ack);
      return;
    }

    const data = await response.json();

    const ack: BitcodeXWalletMsgGetConnectedAppsAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "__get_connected_apps_ack__",
      payload: data,
    };
    port.postMessage(ack);
  } catch (error) {
    const ack: BitcodeXWalletMsgGetConnectedAppsAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "__get_connected_apps_ack__",
      payload: {
        success: false,
        error: { type: "FETCH_ERROR", error: String(error) },
      },
    };
    port.postMessage(ack);
  }
}
