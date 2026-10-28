import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { MakeSvmTxSignData } from "@bitcodex/bitcodex-sdk-core";
import type { FC } from "react";

import { SvmTxFee } from "./svm_tx_fee";
import { SvmTxSignatureContent } from "./svm_tx_signature_content";
import { useParseTx } from "./use_parse_tx";
import { useTxSigModal } from "./use_tx_sig_modal";
import { trackTxButtonEvent } from "@bitcodex-attached/analytics/events";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import styles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";

export interface MakeTxSigModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: MakeSvmTxSignData;
}

export const MakeTxSigModal: FC<MakeTxSigModalProps> = ({
  getIsAborted,
  data,
  modalId,
}) => {
  const { onReject, onApprove, isLoading, isApproveEnabled, isDemo, theme } =
    useTxSigModal({
      getIsAborted,
      data,
      modalId,
    });

  const {
    parsedTx,
    parseError,
    isLoading: isParsing,
  } = useParseTx(data.payload.data.serialized_transaction);

  function handleRejectClick() {
    trackTxButtonEvent({
      eventType: "reject",
      hostOrigin: data.payload.origin,
      chainType: "svm",
      instructions: parsedTx?.instructions ?? null,
    });

    onReject();
  }

  function handleApproveClick() {
    trackTxButtonEvent({
      eventType: "approve",
      hostOrigin: data.payload.origin,
      chainType: "svm",
      instructions: parsedTx?.instructions ?? null,
    });

    onApprove();
  }

  return (
    <div className={styles.container}>
      <CommonModal className={styles.modal}>
        <div className={styles.closeButton} onClick={handleRejectClick}>
          <XCloseIcon size={20} color="var(--fg-quaternary)" />
        </div>

        <div
          data-scroll-container
          className={styles.modalInnerContentContainer}
        >
          <SvmTxSignatureContent
            payload={data.payload}
            parsedTx={parsedTx}
            parseError={parseError}
            isLoading={isParsing}
          />
        </div>

        <Spacing height={12} />

        <SvmTxFee
          serializedTransaction={data.payload.data.serialized_transaction}
          isVersioned={data.payload.data.is_versioned}
        />

        <Spacing height={12} />

        <div className={styles.buttonContainer}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleRejectClick}
            className={styles.rejectButton}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleApproveClick}
            isLoading={isLoading}
            disabled={!isApproveEnabled}
          >
            {isLoading ? "Signing..." : "Approve"}
          </Button>
        </div>
        <Spacing height={12} />

        <SignWithBitcodeXBox theme={theme} />
      </CommonModal>

      {isDemo && <DemoView />}
    </div>
  );
};
