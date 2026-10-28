import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { EthereumTxSignPayload } from "@bitcodex/bitcodex-sdk-core";
import { type FC, Fragment } from "react";
import type { RpcTransactionRequest } from "viem";

import { EthereumTxSummary } from "./ethereum_tx_summary";
import { MetadataContent } from "@bitcodex-attached/components/modal_variants/common/metadata_content/metadata_content";

interface EthereumTxSignatureContentProps {
  payload: EthereumTxSignPayload;
  simulatedTransaction: RpcTransactionRequest | null;
}

export const EthereumTxSignatureContent: FC<
  EthereumTxSignatureContentProps
> = ({ payload, simulatedTransaction }) => {
  return (
    <Fragment>
      <MetadataContent
        origin={payload.origin}
        chainInfo={payload.chain_info}
        signer={payload.signer}
        initialViewType="Login Info"
      />
      <Spacing height={28} />
      <EthereumTxSummary
        payload={payload}
        simulatedTransaction={simulatedTransaction}
      />
    </Fragment>
  );
};
