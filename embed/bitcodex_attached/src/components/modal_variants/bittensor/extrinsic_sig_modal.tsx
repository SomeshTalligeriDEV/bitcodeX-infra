import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { MakeBittensorExtrinsicSignData } from "@bitcodex/bitcodex-sdk-core";
import { payloadBytes, wrapEd25519 } from "@bitcodex/bittensor-chain";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import { type FC, useEffect, useMemo, useState } from "react";

import {
  CallView,
  DangerBox,
  NetworkBadge,
  SigRow,
  SigSection,
} from "./bittensor_sig_parts";
import { decodeSignerPayload, formatTao } from "./decode";
import { useBittensorSignature } from "./use_bittensor_signature";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import styles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";

export interface ExtrinsicSigModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: MakeBittensorExtrinsicSignData;
}

export const ExtrinsicSigModal: FC<ExtrinsicSigModalProps> = ({
  getIsAborted,
  modalId,
  data,
}) => {
  const { payload } = data;
  const signerPayload = payload.data.signer_payload;
  const sig = useBittensorSignature({
    modalId,
    hostOrigin: payload.origin,
    chainId: payload.chain_id,
    signer: payload.signer,
    getIsAborted,
  });
  const api = sig.apiState.status === "ready" ? sig.apiState.api : null;

  const decoded = useMemo(
    () =>
      api ? decodeSignerPayload(api, signerPayload, sig.walletAddress) : null,
    [api, signerPayload, sig.walletAddress],
  );

  // Fee from the iframe's own connection, never from the host.
  const [fee, setFee] = useState<string | null>(null);
  useEffect(() => {
    if (!api || !decoded?.success) {
      return;
    }
    let cancelled = false;
    api
      .tx(api.registry.createType("Call", signerPayload.method))
      .paymentInfo(signerPayload.address)
      .then((info) => {
        if (!cancelled) {
          setFee(formatTao(info.partialFee.toBigInt()));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFee("unavailable");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, decoded, signerPayload]);

  const refusal =
    sig.apiState.status === "refused"
      ? sig.apiState.reason
      : !sig.signerMatches
        ? "This request is for a different account than your BitcodeX wallet."
        : decoded && !decoded.success
          ? decoded.err
          : null;
  const isApproveEnabled =
    !!api && sig.hasKeys && !!decoded?.success && !refusal && !sig.isLoading;

  async function onApprove() {
    if (getIsAborted() || !api || !decoded?.success) {
      return;
    }
    sig.setIsLoading(true);
    try {
      // The bytes are rebuilt here from the payload just shown and checked above.
      const bytes = payloadBytes(
        api.registry,
        signerPayload as unknown as SignerPayloadJSON,
      );
      const res = await sig.signBytes(bytes);
      if (!res.success) {
        return;
      }
      const wrapped = wrapEd25519(res.signature);
      if (!wrapped.success) {
        sig.emitError({ type: "unknown_error", error: wrapped.err });
        return;
      }
      sig.closeWithResult({ type: "multi_signature", signature: wrapped.data });
    } catch (err) {
      sig.emitError({
        type: "unknown_error",
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      sig.setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <CommonModal className={styles.modal}>
        <div className={styles.closeButton} onClick={sig.onReject}>
          <XCloseIcon size={20} color="var(--fg-quaternary)" />
        </div>

        <div
          data-scroll-container
          className={styles.modalInnerContentContainer}
        >
          <SigSection title="Signature request">
            <SigRow label="From app" value={payload.origin} />
            <SigRow
              label="Network"
              value={<NetworkBadge name={sig.networkName} />}
            />
            <SigRow label="Account" value={sig.walletAddress ?? "-"} />
          </SigSection>

          {refusal && (
            <>
              <Spacing height={12} />
              <DangerBox>{refusal}</DangerBox>
            </>
          )}

          {decoded?.success && (
            <SigSection title="Action">
              <CallView card={decoded.data.card} />
            </SigSection>
          )}

          <SigSection title="Network fee">
            <SigRow label="Estimated fee" value={fee ?? "…"} />
          </SigSection>
        </div>

        <Spacing height={12} />

        <div className={styles.buttonContainer}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={sig.onReject}
            className={styles.rejectButton}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onApprove}
            isLoading={sig.isLoading}
            disabled={!isApproveEnabled}
          >
            {sig.isLoading ? "Signing..." : "Approve"}
          </Button>
        </div>
        <Spacing height={12} />

        <SignWithBitcodeXBox theme={sig.theme} />
      </CommonModal>

      {sig.isDemo && <DemoView hideOnMobile />}
    </div>
  );
};
