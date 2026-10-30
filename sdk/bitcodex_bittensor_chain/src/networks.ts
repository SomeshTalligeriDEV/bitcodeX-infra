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
 * Verified 2026-10-29 (00-research.md "Testnet"): endpoints from
 * bittensor.com/docs/concepts/network; genesis hashes read from the live chains.
 * Testnet reports chainType "Development"; mainnet reports "Live".
 */
export const TESTNET_RPC_URL = "wss://test.finney.opentensor.ai:443";
export const TESTNET_GENESIS =
  "0x8f9cf856bf558a14440e75569c9e58594757048d7b3a84b5d25f6bd978263105";
export const MAINNET_GENESIS =
  "0x2f0555cc76fc2840a25a6ea3b9637146806f1f44b090c175ffde2a7e5ab36c03";

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
    rpcUrl: TESTNET_RPC_URL,
    genesisHashes: [TESTNET_GENESIS],
    disabled: false,
  },
  "bittensor:mainnet": {
    chainId: "bittensor:mainnet",
    name: "Mainnet",
    // No default endpoint: mainnet stays disabled until an external security audit.
    rpcUrl: null,
    genesisHashes: [MAINNET_GENESIS],
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

  // Whatever was asked for: if the chain IS mainnet, say so explicitly.
  if (
    chainId !== "bittensor:mainnet" &&
    facts.genesisHash.toLowerCase() === MAINNET_GENESIS
  ) {
    return {
      success: false,
      err: "refusing: this endpoint is Bittensor MAINNET (real TAO); mainnet is disabled",
    };
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
