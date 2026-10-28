import type {
  ChainInfoForAttachedModal,
  MakeEthereumSigResult,
} from "@bitcodex/bitcodex-sdk-core";
import type { Address, RpcTransactionRequest, SignableMessage } from "viem";

export interface MakeSignatureBasePayload {
  chain_info: ChainInfoForAttachedModal;
  origin: string;
  signer: string;
}

export type EthSignParams =
  | {
      type: "sign_transaction";
      data: {
        address: Address;
        transaction: RpcTransactionRequest;
      };
    }
  | {
      type: "personal_sign";
      data: {
        address: Address;
        message: SignableMessage;
      };
    }
  | {
      type: "sign_typedData_v4";
      data: {
        address: Address;
        serializedTypedData: string;
      };
    };

export type EthSignResult = MakeEthereumSigResult;

/**
 * Signer interface for Ethereum
 */
export interface BitcodeXEthSigner {
  getAddress: () => Address | null;
  sign: (params: EthSignParams) => Promise<EthSignResult>;
}
