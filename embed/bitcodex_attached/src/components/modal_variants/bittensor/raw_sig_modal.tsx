import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { MakeBittensorRawSignData } from "@bitcodex/bitcodex-sdk-core";
import { caip2ChainId, parseSiwbMessage } from "@bitcodex/bittensor-chain";
import { hexToU8a, isHex, u8aToHex, u8aWrapBytes } from "@polkadot/util";
import { type FC, useMemo } from "react";

import styles from "./bittensor_sig_modal.module.scss";
import {
  DangerBox,
  NetworkBadge,
  SigRow,
  SigSection,
} from "./bittensor_sig_parts";
import { useBittensorSignature } from "./use_bittensor_signature";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import modalStyles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";

export interface RawSigModalProps {
  getIsAborted: () => boolean;
  modalId: string;
  data: MakeBittensorRawSignData;
}

export const RawSigModal: FC<RawSigModalProps> = ({
  getIsAborted,
  modalId,
  data,
}) => {
  const { payload } = data;
  const sig = useBittensorSignature({
    modalId,
    hostOrigin: payload.origin,
    chainId: payload.chain_id,
    signer: payload.signer,
    getIsAborted,
  });

  const message = useMemo(() => {
    const hex = payload.data.message;
    if (!isHex(hex)) {
      return null;
    }
    const bytes = hexToU8a(hex);
    let text: string | null = null;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      text = null;
    }
    return { bytes, text };
  }, [payload.data.message]);

  // Sign-In with Bittensor: show the fields, and refuse a message that names another
  // site (phishing) or another chain than the one this wallet is connected to.
  const siwb = useMemo(
    () => (message?.text ? parseSiwbMessage(message.text) : null),
    [message],
  );
  const api = sig.apiState.status === "ready" ? sig.apiState.api : null;
  const siwbProblem = (() => {
    if (!siwb) {
      return null;
    }
    let requesterHost: string | null = null;
    try {
      requesterHost = new URL(payload.origin).host;
    } catch {
      requesterHost = null;
    }
    if (siwb.domain !== requesterHost) {
      return `This sign-in is for ${siwb.domain}, but ${payload.origin} is asking. Do not sign.`;
    }
    if (siwb.address !== sig.walletAddress) {
      return "This sign-in is for a different account than your BitcodeX wallet.";
    }
    if (api && siwb.chainId !== caip2ChainId(api.genesisHash.toHex())) {
      return "This sign-in is for a different network than the one BitcodeX is connected to.";
    }
    return null;
  })();

  const refusal = !message
    ? "The message is not valid hex."
    : !sig.signerMatches
      ? "This request is for a different account than your BitcodeX wallet."
      : siwbProblem;
  const isApproveEnabled =
    sig.hasKeys && !refusal && !sig.isLoading && (!siwb || !!api);

  async function onApprove() {
    if (getIsAborted() || !message) {
      return;
    }
    sig.setIsLoading(true);
    try {
      // Always <Bytes>-wrapped, so a "message" can never be a transaction payload.
      const res = await sig.signBytes(u8aWrapBytes(message.bytes));
      if (!res.success) {
        return;
      }
      sig.closeWithResult({
        type: "signature",
        signature: u8aToHex(res.signature),
      });
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
    <div className={modalStyles.container}>
      <CommonModal className={modalStyles.modal}>
        <div className={modalStyles.closeButton} onClick={sig.onReject}>
          <XCloseIcon size={20} color="var(--fg-quaternary)" />
        </div>

        <div
          data-scroll-container
          className={modalStyles.modalInnerContentContainer}
        >
          <SigSection title="Sign message">
            <SigRow label="From app" value={payload.origin} />
            <SigRow
              label="Network"
              value={<NetworkBadge name={sig.networkName} />}
            />
            <SigRow label="Account" value={sig.walletAddress ?? "-"} />
          </SigSection>

          {refusal && <DangerBox>{refusal}</DangerBox>}

          {siwb && (
            <SigSection title="Sign in with Bittensor">
              <SigRow label="Site" value={siwb.domain} />
              {siwb.statement && (
                <SigRow label="Statement" value={siwb.statement} />
              )}
              <SigRow label="URI" value={siwb.uri} />
              <SigRow label="Chain" value={siwb.chainId} />
              {siwb.nonce && <SigRow label="Nonce" value={siwb.nonce} />}
              {siwb.issuedAt && (
                <SigRow label="Issued at" value={siwb.issuedAt} />
              )}
              {siwb.expirationTime && (
                <SigRow label="Expires" value={siwb.expirationTime} />
              )}
              <SigRow
                label="Effect"
                value="Proves you own this address. It cannot move funds."
              />
            </SigSection>
          )}

          {message && (
            <SigSection
              title={message.text !== null ? "Message" : "Message (hex)"}
            >
              <pre className={styles.args}>
                {message.text ?? payload.data.message}
              </pre>
            </SigSection>
          )}
        </div>

        <Spacing height={12} />

        <div className={modalStyles.buttonContainer}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={sig.onReject}
            className={modalStyles.rejectButton}
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
            {sig.isLoading ? "Signing..." : "Sign"}
          </Button>
        </div>
        <Spacing height={12} />

        <SignWithBitcodeXBox theme={sig.theme} />
      </CommonModal>

      {sig.isDemo && <DemoView hideOnMobile />}
    </div>
  );
};
