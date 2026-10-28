import type { Result } from "@bitcodex/stdlib-js";

export type BittensorChainId =
  | "bittensor:localnet"
  | "bittensor:testnet"
  | "bittensor:mainnet";

export interface BittensorNetwork {
  chainId: BittensorChainId;
  name: string;
  rpcUrl: string | null;
  /**
   * Genesis hashes this network is accepted with. Empty for localnet: a fresh localnet has
   * a new genesis, so localnet is accepted by `system_chainType` + local endpoint instead.
   */
  genesisHashes: string[];
  /** Mainnet is disabled until an external audit (CLAUDE.md, hard safety rules). */
  disabled: boolean;
}

export const SS58_PREFIX = 42;
export const TAO_DECIMALS = 9;

export const LOCALNET_RPC_URL = "ws://127.0.0.1:9944";

/**
 * Testnet endpoint and genesis hash are NOT verified yet (bitcodex-docs/00-research.md).
 * Until a probe records them, testnet has no rpcUrl and no accepted genesis, so every
 * testnet connection is refused.
 */
export const NETWORKS: Record<BittensorChainId, BittensorNetwork> = {
  "bittensor:localnet": {
    chainId: "bittensor:localnet",
    name: "Localnet",
    rpcUrl: LOCALNET_RPC_URL,
    genesisHashes: [],
    disabled: false,
  },
  "bittensor:testnet": {
    chainId: "bittensor:testnet",
    name: "Testnet",
    rpcUrl: null,
    genesisHashes: [],
    disabled: false,
  },
  "bittensor:mainnet": {
    chainId: "bittensor:mainnet",
    name: "Mainnet",
    rpcUrl: null,
    genesisHashes: [],
    disabled: true,
  },
};

export function isBittensorChainId(value: string): value is BittensorChainId {
  return value in NETWORKS;
}

const LOCAL_ENDPOINT = /^wss?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/;

export interface NetworkFacts {
  /** `api.genesisHash.toHex()` of the connected chain. */
  genesisHash: string;
  /** `system_chainType` as a string, e.g. "Local", "Development", "Live". */
  chainType: string;
  /** The websocket endpoint the connection was opened to. */
  endpoint: string;
}

export interface CheckNetworkOptions {
  /** Only `true` when BITCODEX_ENABLE_MAINNET=true, which is not allowed before the audit. */
  enableMainnet?: boolean;
}

/**
 * Decide whether a connected chain is the network the caller asked for.
 * Never uses the chain name: localnet reports "Bittensor", the same as mainnet.
 * Allowlist only: anything that is not positively identified is refused.
 */
export function checkNetwork(
  chainId: BittensorChainId,
  facts: NetworkFacts,
  options: CheckNetworkOptions = {},
): Result<BittensorNetwork, string> {
  const network = NETWORKS[chainId];
  if (!network) {
    return { success: false, err: `unknown chain id: ${chainId}` };
  }
  if (network.disabled && !options.enableMainnet) {
    return { success: false, err: `${network.name} is disabled` };
  }

  if (chainId === "bittensor:localnet") {
    const localType =
      facts.chainType === "Local" || facts.chainType === "Development";
    if (!localType) {
      return {
        success: false,
        err: `refusing localnet: chainType is "${facts.chainType}"`,
      };
    }
    if (!LOCAL_ENDPOINT.test(facts.endpoint)) {
      return {
        success: false,
        err: `refusing localnet: endpoint ${facts.endpoint} is not local`,
      };
    }
    return { success: true, data: network };
  }

  const genesis = facts.genesisHash.toLowerCase();
  if (!network.genesisHashes.some((h) => h.toLowerCase() === genesis)) {
    return {
      success: false,
      err: `refusing ${network.name}: genesis ${facts.genesisHash} is not allowlisted`,
    };
  }
  return { success: true, data: network };
}
