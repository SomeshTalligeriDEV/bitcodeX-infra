import {
  convertChainInfoToRpcChain,
  DEFAULT_CHAIN_ID,
  sendGetEthChainInfo,
} from "@bitcodex-sdk-eth/chains";
import {
  BitcodeXEIP1193Provider,
  type BitcodeXEthRpcChain,
} from "@bitcodex-sdk-eth/provider";
import type { BitcodeXEthWalletInterface } from "@bitcodex-sdk-eth/types";
import { parseChainId } from "@bitcodex-sdk-eth/utils";

export async function getEthereumProvider(
  this: BitcodeXEthWalletInterface,
): Promise<BitcodeXEIP1193Provider> {
  if (this.provider !== null) {
    return this.provider;
  }

  await this.waitUntilInitialized;

  const chainInfoRes = await sendGetEthChainInfo(this.bitcodexWallet);
  if (!chainInfoRes.success) {
    throw new Error(
      `Failed to get chain registry response: ${chainInfoRes.err.toString()}`,
    );
  }

  let rpcChains: BitcodeXEthRpcChain[] = chainInfoRes.data
    .map((chain) => convertChainInfoToRpcChain(chain))
    .filter((chain) => chain !== null);

  if (rpcChains.length === 0) {
    throw new Error("No chains found");
  }

  const activeChain = rpcChains.find(
    (chain) => parseChainId(chain.chainId) === DEFAULT_CHAIN_ID,
  );

  if (activeChain !== undefined) {
    rpcChains = [
      activeChain,
      ...rpcChains.filter(
        (chain) => parseChainId(chain.chainId) !== DEFAULT_CHAIN_ID,
      ),
    ];
  }

  this.provider = new BitcodeXEIP1193Provider({
    signer: {
      sign: (params) => this.makeSignature(params),
      getAddress: () => this.state.address,
    },
    chains: rpcChains,
  });

  return this.provider;
}
