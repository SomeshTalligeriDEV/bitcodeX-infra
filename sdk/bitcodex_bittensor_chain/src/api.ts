import type { Result } from "@bitcodex/stdlib-js";
import { ApiPromise, WsProvider } from "@polkadot/api";

import {
  type BittensorChainId,
  type CheckNetworkOptions,
  checkNetwork,
  NETWORKS,
} from "./networks";

const apis = new Map<string, Promise<ApiPromise>>();

export interface GetApiOptions extends CheckNetworkOptions {
  /** Override the network's default endpoint (e.g. a different localnet port). */
  rpcUrl?: string;
}

/**
 * Cached, network-checked connection. Refuses (and disconnects) when the connected chain
 * is not positively the requested network (genesis hash / system_chainType, never name).
 */
export async function getApi(
  chainId: BittensorChainId,
  options: GetApiOptions = {},
): Promise<Result<ApiPromise, string>> {
  const network = NETWORKS[chainId];
  const endpoint = options.rpcUrl ?? network?.rpcUrl;
  if (!network || !endpoint) {
    return { success: false, err: `no RPC endpoint configured for ${chainId}` };
  }
  if (network.disabled && !options.enableMainnet) {
    return { success: false, err: `${network.name} is disabled` };
  }

  const key = `${chainId}|${endpoint}`;
  let pending = apis.get(key);
  if (!pending) {
    pending = ApiPromise.create({
      provider: new WsProvider(endpoint),
      noInitWarn: true,
    });
    apis.set(key, pending);
  }

  let api: ApiPromise;
  try {
    api = await pending;
  } catch (err) {
    apis.delete(key);
    return {
      success: false,
      err: `cannot connect to ${endpoint}: ${String(err)}`,
    };
  }

  const chainType = (await api.rpc.system.chainType()).toString();
  const check = checkNetwork(
    chainId,
    { genesisHash: api.genesisHash.toHex(), chainType, endpoint },
    options,
  );
  if (!check.success) {
    apis.delete(key);
    await api.disconnect();
    return check;
  }
  return { success: true, data: api };
}

/** Disconnect and forget every cached connection (tests, logout). */
export async function disconnectAll(): Promise<void> {
  const all = [...apis.values()];
  apis.clear();
  await Promise.allSettled(all.map(async (p) => (await p).disconnect()));
}
