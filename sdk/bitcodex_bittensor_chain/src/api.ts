import type { Result } from "@bitcodex/stdlib-js";
import { ApiPromise, WsProvider } from "@polkadot/api";

import {
  type BittensorChainId,
  type CheckNetworkOptions,
  checkNetwork,
  NETWORKS,
} from "./networks";

const apis = new Map<string, Promise<ApiPromise>>();

const HEALTH_TIMEOUT_MS = 10_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`timed out after ${ms} ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/**
 * A cached connection is only reused if the node still answers and still has the same
 * genesis: a restarted localnet is a new chain, and the old connection's metadata and
 * genesis no longer apply (seen 2026-10-29: the faucet hung after a localnet restart).
 */
async function stillSameChain(api: ApiPromise): Promise<boolean> {
  try {
    const genesis = await withTimeout(
      api.rpc.chain.getBlockHash(0),
      HEALTH_TIMEOUT_MS,
    );
    return genesis.toHex() === api.genesisHash.toHex();
  } catch {
    return false;
  }
}

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
  /** Internal: a stale cached connection was already replaced once. */
  retried = false,
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
    api = await withTimeout(pending, 60_000);
    if (!(await stillSameChain(api))) {
      apis.delete(key);
      api.disconnect().catch(() => undefined);
      if (retried) {
        return {
          success: false,
          err: `${endpoint} is not answering (or its chain changed); try again`,
        };
      }
      return getApi(chainId, options, true);
    }
  } catch (err) {
    apis.delete(key);
    return {
      success: false,
      err: `cannot connect to ${endpoint}: ${String(err)}`,
    };
  }

  let chainType: string;
  try {
    chainType = (
      await withTimeout(api.rpc.system.chainType(), HEALTH_TIMEOUT_MS)
    ).toString();
  } catch (err) {
    apis.delete(key);
    api.disconnect().catch(() => undefined);
    return { success: false, err: `cannot read chain type: ${String(err)}` };
  }
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
