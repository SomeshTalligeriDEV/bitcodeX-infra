import { type BittensorChainId, NETWORKS } from "@bitcodex/sdk-bittensor";

/**
 * Network this app uses: NEXT_PUBLIC_BITTENSOR_CHAIN_ID = bittensor:localnet (default)
 * or bittensor:testnet. Mainnet is refused until an external security audit.
 */
function chainIdFromEnv(): "bittensor:localnet" | "bittensor:testnet" {
  const raw =
    process.env.NEXT_PUBLIC_BITTENSOR_CHAIN_ID || "bittensor:localnet";
  if (raw === "bittensor:localnet" || raw === "bittensor:testnet") {
    return raw;
  }
  throw new Error(
    `NEXT_PUBLIC_BITTENSOR_CHAIN_ID=${raw} is not allowed (localnet or testnet only)`,
  );
}

export const CHAIN_ID: BittensorChainId &
  ("bittensor:localnet" | "bittensor:testnet") = chainIdFromEnv();
export const NETWORK_NAME = NETWORKS[CHAIN_ID].name;
export const IS_LOCALNET = CHAIN_ID === "bittensor:localnet";

/** No testnet faucet is listed in the official docs (bittensor.com/docs/concepts/network). */
export const TESTNET_FUNDING_NOTE =
  "Testnet TAO: the official Bittensor docs list no testnet faucet. Ask the Bittensor community for testnet TAO and send it to this address.";
