import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { CosmosTxSigData } from "@bitcodex/bitcodex-sdk-core";
import type { FC } from "react";

import { CosmosTxFee } from "./cosmos_tx_fee";
import { CosmosTxSignatureContent } from "./cosmos_tx_signature_content";
import { useTxSigModal } from "./use_tx_sig_modal";
import { trackTxButtonEvent } from "@bitcodex-attached/analytics/events";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import styles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";
import { extractMsgsFromSignDoc } from "@bitcodex-attached/web3/cosmos/sign_doc";

export const MakeTxSigModal: FC<MakeTxSigModalProps> = ({
  getIsAborted,
  data,
  modalId,
}) => {
  const useTxSigModalRes = useTxSigModal({
    getIsAborted,
    data,
    modalId,
  });

  let content = null;
  let demoContent = null;

  if (useTxSigModalRes.success) {
    const {
      onReject,
      onApprove,
      isLoading,
      isFeeLoading,
      isApproveButtonDisabled,
      isDemo,
      theme,
      sigData,
      signDocJson,
      insufficientBalanceFee,
    } = useTxSigModalRes.data;

    if (isDemo) {
      demoContent = <DemoView />;
    }

    function handleRejectClick() {
      const msgsRes = extractMsgsFromSignDoc(sigData.payload.signDoc);
      if (msgsRes.success) {
        trackTxButtonEvent({
          eventType: "reject",
          hostOrigin: sigData.payload.origin,
          chainType: "cosmos",
          chainId: sigData.payload.chain_info.chain_id,
          messages: msgsRes.data,
        });
      }

      onReject();
    }

    function handleApproveClick() {
      const msgsRes = extractMsgsFromSignDoc(sigData.payload.signDoc);
      if (msgsRes.success) {
        trackTxButtonEvent({
          eventType: "approve",
          hostOrigin: sigData.payload.origin,
          chainType: "cosmos",
          chainId: sigData.payload.chain_info.chain_id,
          messages: msgsRes.data,
        });
      }

      onApprove();
    }

    content = (
      <>
        <div className={styles.closeButton} onClick={handleRejectClick}>
          <XCloseIcon size={20} color="var(--fg-quaternary)" />
        </div>

        <div
          data-scroll-container
          className={styles.modalInnerContentContainer}
        >
          <CosmosTxSignatureContent
            payload={sigData.payload}
            signDocJson={signDocJson}
            modalId={modalId}
          />
        </div>

        <Spacing height={12} />
        <CosmosTxFee
          signDocJson={signDocJson}
          chainInfo={sigData.payload.chain_info}
          forceIsLoading={isFeeLoading}
          modalId={modalId}
          insufficientBalanceFee={insufficientBalanceFee}
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
            disabled={isApproveButtonDisabled}
          >
            {isLoading ? "Signing..." : "Approve"}
          </Button>
        </div>
        <Spacing height={12} />

        <SignWithBitcodeXBox theme={theme} />
      </>
    );
  } else {
    content = <p>Error occurred</p>;
  }

  return (
    <div className={styles.container}>
      <CommonModal className={styles.modal}>{content}</CommonModal>
      {demoContent}
    </div>
  );
};

export interface MakeTxSigModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: CosmosTxSigData;
}
