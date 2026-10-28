import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { CosmosTxSignPayload } from "@bitcodex/bitcodex-sdk-core";
import type { StdSignDoc } from "@keplr-wallet/types";
import type { FC } from "react";

import { CosmosTxSummary } from "./cosmos_tx_summary";
import { MetadataContent } from "@bitcodex-attached/components/modal_variants/common/metadata_content/metadata_content";

interface CosmosTxSignatureContentProps {
  payload: CosmosTxSignPayload;
  signDocJson: StdSignDoc;
  modalId: string;
}

export const CosmosTxSignatureContent: FC<CosmosTxSignatureContentProps> = ({
  payload,
  signDocJson,
  modalId,
}) => {
  return (
    <div>
      <MetadataContent
        origin={payload.origin}
        chainInfo={payload.chain_info}
        signer={payload.signer}
        initialViewType="Login Info"
      />
      <Spacing height={28} />
      <CosmosTxSummary
        payload={payload}
        modalId={modalId}
        signDocJson={signDocJson}
      />
    </div>
  );
};
