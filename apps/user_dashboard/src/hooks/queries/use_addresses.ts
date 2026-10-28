/**
 * Address fetching with TanStack Query
 * Replaces the side-effect based address fetching in state/addresses.ts
 */

import { useBitcodeXCosmos } from "@bitcodex/bitcodex-sdk-react/cosmos";
import { useBitcodeXEth } from "@bitcodex/bitcodex-sdk-react/eth";
import { useBitcodeXSvm } from "@bitcodex/bitcodex-sdk-react/svm";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useEnabledChains } from "./use_chains";
import type { ModularChainInfo } from "@bitcodex-user-dashboard/types/chain";
import { isEvmOnlyChain } from "@bitcodex-user-dashboard/utils/chain";

/**
 * Hook to get ETH address
 */
export function useEthAddress() {
  const { ethWallet: bitcodexEth, isReady: isInitialized } = useBitcodeXEth();

  const query = useQuery({
    queryKey: ["address", "eth"],
    queryFn: async () => {
      if (!bitcodexEth) {
        return null;
      }
      return bitcodexEth.getAddress() ?? null;
    },
    enabled: !!bitcodexEth && isInitialized,
    staleTime: Infinity, // Address doesn't change
    gcTime: Infinity,
  });

  return {
    address: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useSVMAddress() {
  const { svmWallet: bitcodexSvm, isReady: isInitialized } = useBitcodeXSvm();

  const query = useQuery({
    queryKey: ["address", "svm"],
    queryFn: async () => {
      if (!bitcodexSvm) {
        return null;
      }
      return bitcodexSvm.state.publicKey?.toBase58() ?? null;
    },
    enabled: !!bitcodexSvm && isInitialized,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    address: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Hook to get a single Cosmos chain address (works for non-enabled chains)
 */
export function useCosmosAddress(chainId: string | undefined) {
  const { cosmosWallet: bitcodexCosmos, isReady: isInitialized } =
    useBitcodeXCosmos();

  const query = useQuery({
    queryKey: ["address", "cosmos", chainId],
    queryFn: async () => {
      if (!bitcodexCosmos || !chainId) {
        return null;
      }
      const key = await bitcodexCosmos.getKey(chainId);
      return key?.bech32Address ?? null;
    },
    enabled: !!bitcodexCosmos && isInitialized && !!chainId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    address: query.data ?? undefined,
    isLoading: query.isLoading,
  };
}

/**
 * Hook to get address for a chain (auto-detects chain type).
 * Works for both enabled and non-enabled chains.
 */
export function useChainAddress(chainInfo: ModularChainInfo | undefined) {
  const { address: ethAddress, isLoading: ethLoading } = useEthAddress();
  const { address: svmAddress, isLoading: svmLoading } = useSVMAddress();
  const { address: cosmosAddress, isLoading: cosmosLoading } = useCosmosAddress(
    chainInfo?.cosmos ? chainInfo.chainId : undefined,
  );

  if (!chainInfo) {
    return { address: undefined, isLoading: false };
  }

  if (chainInfo.svm) {
    return { address: svmAddress, isLoading: svmLoading };
  }

  if (isEvmOnlyChain(chainInfo)) {
    return { address: ethAddress, isLoading: ethLoading };
  }

  if (chainInfo.cosmos) {
    return { address: cosmosAddress, isLoading: cosmosLoading };
  }

  return { address: undefined, isLoading: false };
}

/**
 * Hook to fetch Cosmos addresses for all enabled Cosmos chains
 */
export function useCosmosAddresses() {
  const { cosmosWallet: bitcodexCosmos, isReady: isInitialized } =
    useBitcodeXCosmos();
  const { chains: enabledChains } = useEnabledChains();

  const cosmosChainIds = useMemo(
    () =>
      enabledChains
        .filter((chain) => !!chain.cosmos)
        .map((chain) => chain.chainId),
    [enabledChains],
  );

  const query = useQuery({
    queryKey: ["addresses", "cosmos", cosmosChainIds.sort().join(",")],
    queryFn: async () => {
      if (!bitcodexCosmos) {
        return {};
      }

      const results: Record<string, string | undefined> = {};

      await Promise.all(
        cosmosChainIds.map(async (chainId) => {
          try {
            const key = await bitcodexCosmos.getKey(chainId);
            results[chainId] = key?.bech32Address;
          } catch (error) {
            console.error(
              `Failed to fetch cosmos address for ${chainId}:`,
              error,
            );
            results[chainId] = undefined;
          }
        }),
      );

      return results;
    },
    enabled: !!bitcodexCosmos && isInitialized && cosmosChainIds.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return {
    addresses: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
  };
}
