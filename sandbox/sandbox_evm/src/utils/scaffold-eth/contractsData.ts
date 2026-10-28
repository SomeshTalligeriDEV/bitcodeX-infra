import { useTargetNetwork } from "@bitcodex-sandbox-evm/hooks/scaffold-eth";
import {
  contracts,
  type GenericContractsDeclaration,
} from "@bitcodex-sandbox-evm/utils/scaffold-eth/contract";

const DEFAULT_ALL_CONTRACTS: GenericContractsDeclaration[number] = {};

export function useAllContracts() {
  const { targetNetwork } = useTargetNetwork();
  const contractsData = contracts?.[targetNetwork.id];
  // using constant to avoid creating a new object on every call
  return contractsData || DEFAULT_ALL_CONTRACTS;
}
