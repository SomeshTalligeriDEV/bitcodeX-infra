import type { MakeBittensorSigData } from "@bitcodex/bitcodex-sdk-core";
import type { FC } from "react";

import { ExtrinsicSigModal } from "./extrinsic_sig_modal";
import { RawSigModal } from "./raw_sig_modal";

export interface MakeSignatureBittensorModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: MakeBittensorSigData;
}

export const MakeSignatureBittensorModal: FC<
  MakeSignatureBittensorModalProps
> = ({ getIsAborted, data, modalId }) => {
  switch (data.sign_type) {
    case "extrinsic": {
      return (
        <ExtrinsicSigModal
          data={data}
          modalId={modalId}
          getIsAborted={getIsAborted}
        />
      );
    }
    case "raw": {
      return (
        <RawSigModal
          data={data}
          modalId={modalId}
          getIsAborted={getIsAborted}
        />
      );
    }
  }
};
