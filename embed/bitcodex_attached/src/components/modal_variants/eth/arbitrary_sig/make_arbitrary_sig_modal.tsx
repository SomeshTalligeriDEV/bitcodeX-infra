import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { MakeArbitrarySigData } from "@bitcodex/bitcodex-sdk-core";
import { type FC, useMemo, useState } from "react";

import { EthereumArbitrarySignatureContent } from "./ethereum_arbitrary_signature_content";
import { useArbitrarySigModal } from "./hooks/use_arbitrary_sig_modal";
import { ArbitrarySignatureDesc } from "@bitcodex-attached/components/modal_variants/common/arbitrary_sig_desc/arbitrary_signature_desc";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import styles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { RiskWarningCheckBox } from "@bitcodex-attached/components/modal_variants/common/risk_warning/risk_warning";
import { EthereumSiweSignatureContent } from "@bitcodex-attached/components/modal_variants/eth/arbitrary_sig/siwe_sig/make_siwe_signature_content";
import {
  getSiweMessage,
  verifySiweMessage,
} from "@bitcodex-attached/components/modal_variants/eth/siwe_message";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";
import { useMemoryState } from "@bitcodex-attached/store/memory";

export const MakeArbitrarySigModal: FC<MakeArbitrarySigModalProps> = ({
  getIsAborted,
  data,
  modalId,
}) => {
  const isMobileNative = useMemoryState((state) => state.isMobileNative);
  const siweMessage = getSiweMessage(data.payload.data.message);
  const isValidSiweMessage = siweMessage
    ? verifySiweMessage(siweMessage, data.payload.origin, {
        skipOriginCheck: isMobileNative,
      })
    : false;
  const [isSiweRiskWarningChecked, setIsSiweRiskWarningChecked] =
    useState(false);

  const {
    onReject,
    onApprove,
    isApproveEnabled: isApproveEnabledOriginal,
    isLoading,
    isDemo,
    theme,
    hasOnChainSchema,
  } = useArbitrarySigModal({
    getIsAborted,
    data,
    modalId,
  });
  const isApproveEnabled = useMemo(() => {
    if (siweMessage && !isValidSiweMessage) {
      return isApproveEnabledOriginal && isSiweRiskWarningChecked;
    }

    return isApproveEnabledOriginal;
  }, [
    isApproveEnabledOriginal,
    isSiweRiskWarningChecked,
    siweMessage,
    isValidSiweMessage,
  ]);

  return (
    <div className={styles.container}>
      <CommonModal className={styles.modal}>
        <div className={styles.closeButton} onClick={onReject}>
          <XCloseIcon size={20} color="var(--fg-quaternary)" />
        </div>

        <div
          data-scroll-container
          className={styles.modalInnerContentContainer}
        >
          {siweMessage ? (
            <EthereumSiweSignatureContent
              payload={data.payload}
              theme={theme}
            />
          ) : (
            <EthereumArbitrarySignatureContent payload={data.payload} />
          )}
        </div>

        <Spacing height={12} />
        {!hasOnChainSchema && <ArbitrarySignatureDesc />}

        <Spacing height={12} />

        {siweMessage && !isValidSiweMessage && (
          <>
            <RiskWarningCheckBox
              checked={isSiweRiskWarningChecked}
              onChange={setIsSiweRiskWarningChecked}
            />
            <Spacing height={12} />
          </>
        )}

        <div className={styles.buttonContainer}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onReject}
            className={styles.rejectButton}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onApprove}
            isLoading={isLoading}
            disabled={!isApproveEnabled}
          >
            {isLoading ? "Signing..." : "Approve"}
          </Button>
        </div>
        <Spacing height={12} />

        <SignWithBitcodeXBox theme={theme} />
      </CommonModal>

      {isDemo && <DemoView hideOnMobile />}
    </div>
  );
};

export interface MakeArbitrarySigModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: MakeArbitrarySigData;
}
