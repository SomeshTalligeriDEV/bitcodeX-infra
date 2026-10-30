import type {
  BitcodeXAppConfig,
  BitcodeXWalletMsgGetAppConfigAck,
} from "@bitcodex/bitcodex-sdk-core";

import { BITCODEX_SDK_TARGET } from "./target";
import type { MsgEventContext } from "./types";
import { BITCODEX_API_ENDPOINT } from "@bitcodex-attached/requests/endpoints";
import { fetchWithRetry } from "@bitcodex-attached/requests/retry";
import { useMemoryState } from "@bitcodex-attached/store/memory";

type StoredConfig = Omit<BitcodeXAppConfig, "origin_allowed">;

const TTL_MS = 60_000;
const cache = new Map<string, { at: number; config: Promise<StoredConfig> }>();

/** App config for an API key from the BitcodeX API (developer dashboard settings). */
export function loadAppConfig(apiKey: string): Promise<StoredConfig> {
  const hit = cache.get(apiKey);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.config;
  }
  const config = (async () => {
    const res = await fetchWithRetry(`${BITCODEX_API_ENDPOINT}/app_config/v1`, {
      headers: { "x-api-key": apiKey },
    });
    const body = await res.json();
    if (!body.success) {
      throw new Error(body.msg ?? `app config: HTTP ${res.status}`);
    }
    return body.data as StoredConfig;
  })();
  cache.set(apiKey, { at: Date.now(), config });
  config.catch(() => cache.delete(apiKey));
  return config;
}

/** open_modal can arrive before init stored the key (popup windows): wait briefly. */
function waitForApiKey(timeoutMs: number): Promise<string | null> {
  const now = useMemoryState.getState().apiKey;
  if (now) {
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve(useMemoryState.getState().apiKey);
    }, timeoutMs);
    const unsub = useMemoryState.subscribe((state) => {
      if (state.apiKey) {
        clearTimeout(timer);
        unsub();
        resolve(state.apiKey);
      }
    });
  });
}

/**
 * Whether `origin` (the verified postMessage origin) may use the app. An app with an
 * empty list allows any origin; otherwise the origin must be listed exactly.
 * Fails closed: no API key or no config → not allowed.
 */
export async function isOriginAllowed(
  origin: string,
): Promise<{ allowed: boolean; reason: string | null }> {
  const apiKey = await waitForApiKey(5_000);
  if (!apiKey) {
    return {
      allowed: false,
      reason: "this page did not initialise BitcodeX with an app key",
    };
  }
  try {
    const config = await loadAppConfig(apiKey);
    if (
      config.allowed_origins.length === 0 ||
      config.allowed_origins.includes(origin)
    ) {
      return { allowed: true, reason: null };
    }
    return {
      allowed: false,
      reason: `${origin} is not in the allowed origins of app "${config.label}"`,
    };
  } catch (err) {
    return {
      allowed: false,
      reason: `cannot load app settings: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function handleGetAppConfig(ctx: MsgEventContext) {
  const reply = (payload: BitcodeXWalletMsgGetAppConfigAck["payload"]) => {
    const ack: BitcodeXWalletMsgGetAppConfigAck = {
      target: BITCODEX_SDK_TARGET,
      msg_type: "get_app_config_ack",
      payload,
    };
    ctx.port.postMessage(ack);
  };
  const apiKey = useMemoryState.getState().apiKey;
  if (!apiKey) {
    reply({ success: false, err: "no app key" });
    return;
  }
  try {
    const config = await loadAppConfig(apiKey);
    const { allowed } = await isOriginAllowed(ctx.hostOrigin);
    reply({ success: true, data: { ...config, origin_allowed: allowed } });
  } catch (err) {
    reply({
      success: false,
      err: err instanceof Error ? err.message : String(err),
    });
  }
}

/** The network this app is configured for in the dashboard, or null if unknown. */
export async function appNetwork(): Promise<string | null> {
  const apiKey = useMemoryState.getState().apiKey;
  if (!apiKey) {
    return null;
  }
  try {
    return (await loadAppConfig(apiKey)).network;
  } catch {
    return null;
  }
}
