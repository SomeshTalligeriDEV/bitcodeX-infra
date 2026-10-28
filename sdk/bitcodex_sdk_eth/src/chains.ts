import type {
  BitcodeXWalletInterface,
  BitcodeXWalletMsgGetEthChainInfo,
} from "@bitcodex/bitcodex-sdk-core";
import type { Result } from "@bitcodex/stdlib-js";
import type { ChainInfo } from "@keplr-wallet/types";
import { toHex } from "viem";

import type { SendGetEthChainInfoError } from "@bitcodex-sdk-eth/errors";
import type { BitcodeXEthRpcChain } from "@bitcodex-sdk-eth/provider";
import { parseChainId } from "@bitcodex-sdk-eth/utils";

export const DEFAULT_CHAIN_ID = 1;

export function convertChainInfoToRpcChain(
  chainInfo: ChainInfo,
): BitcodeXEthRpcChain | null {
  if (chainInfo.currencies.length === 0) {
    return null;
  }

  return {
    chainId: toHex(parseChainId(chainInfo.chainId)),
    chainName: chainInfo.chainName,
    rpcUrls: [chainInfo.rpc],
    nativeCurrency: {
      name: chainInfo.currencies[0].coinMinimalDenom,
      symbol: chainInfo.currencies[0].coinDenom,
      decimals: chainInfo.currencies[0].coinDecimals,
    },
    chainSymbolImageUrl: chainInfo.chainSymbolImageUrl,
    currencies: chainInfo.currencies,
    bip44: chainInfo.bip44,
    features: chainInfo.features,
    evm: chainInfo.evm,
  };
}

export async function sendGetEthChainInfo(
  bitcodexWallet: BitcodeXWalletInterface,
  chainId?: string,
): Promise<Result<ChainInfo[], SendGetEthChainInfoError>> {
  const msg: BitcodeXWalletMsgGetEthChainInfo = {
    target: "bitcodex_attached",
    msg_type: "get_eth_chain_info",
    payload: {
      chain_id: chainId ?? null,
    },
  };

  const res = await bitcodexWallet.sendMsgToIframe(msg);

  if (res.msg_type !== "get_eth_chain_info_ack") {
    return { success: false, err: { type: "wrong_ack_message_type" } };
  }

  if (!res.payload.success) {
    return {
      success: false,
      err: { type: "payload_contains_err", err: res.payload.err },
    };
  }

  return { success: true, data: res.payload.data };
}
