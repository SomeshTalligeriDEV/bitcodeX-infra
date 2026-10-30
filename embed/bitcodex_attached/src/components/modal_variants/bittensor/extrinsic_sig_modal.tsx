import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { MakeBittensorExtrinsicSignData } from "@bitcodex/bitcodex-sdk-core";
import {
  describePermission,
  getProxies,
  getProxyFilter,
  payloadBytes,
  proxyDeposit,
  quoteRegistration,
  wrapEd25519,
} from "@bitcodex/bittensor-chain";
import type { SignerPayloadJSON } from "@polkadot/types/types";
import { type FC, useEffect, useMemo, useState } from "react";

import bt from "./bittensor_sig_modal.module.scss";
import {
  CallView,
  DangerBox,
  NetworkBadge,
  SigRow,
  SigSection,
} from "./bittensor_sig_parts";
import {
  decodeSignerPayload,
  formatTao,
  movedRao,
  permissionGrants,
  registrationNetuids,
} from "./decode";
import { useBittensorSignature } from "./use_bittensor_signature";
import { CommonModal } from "@bitcodex-attached/components/modal_variants/common/common_modal";
import { DemoView } from "@bitcodex-attached/components/modal_variants/common/make_signature/demo_view";
import styles from "@bitcodex-attached/components/modal_variants/common/make_signature/make_signature_modal.module.scss";
import { SignWithBitcodeXBox } from "@bitcodex-attached/components/sign_with_bitcodex_box/sign_with_bitcodex_box";
import {
  getMfaStatus,
  type MfaStatus,
  verifyMfaCode,
} from "@bitcodex-attached/requests/mfa";

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

  // Registration cost decays every block: show the cost for the NEXT block, live.
  const [regCosts, setRegCosts] = useState<Record<number, string>>({});
  useEffect(() => {
    if (!api || !decoded?.success) {
      return;
    }
    const netuids = [...new Set(registrationNetuids(decoded.data.plain))];
    if (netuids.length === 0) {
      return;
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    api.rpc.chain
      .subscribeNewHeads(() => {
        Promise.all(netuids.map((n) => quoteRegistration(api, n)))
          .then((quotes) => {
            if (!cancelled) {
              setRegCosts(
                Object.fromEntries(
                  quotes.map((q) => [q.netuid, formatTao(q.cost)]),
                ),
              );
            }
          })
          .catch(() => undefined);
      })
      .then((u) => {
        unsub = u;
      });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [api, decoded]);

  // Permission grants: what the delegate will be able to do, from the chain's own
  // proxy filter, and the deposit reserved from this wallet.
  const [grants, setGrants] = useState<
    { proxyType: string; can: string[]; broad: boolean; deposit: string }[]
  >([]);
  useEffect(() => {
    if (!api || !decoded?.success || !sig.walletAddress) {
      return;
    }
    const wanted = permissionGrants(decoded.data.plain);
    if (wanted.length === 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      const existing = (await getProxies(api, sig.walletAddress as string))
        .delegations.length;
      const out = [];
      for (const [i, g] of wanted.entries()) {
        const filter = await getProxyFilter(api, g.proxyType);
        const text = filter
          ? describePermission(filter)
          : { can: ["unknown permission type"], broad: true };
        out.push({
          proxyType: g.proxyType,
          can: text.can,
          broad: text.broad,
          deposit: formatTao(proxyDeposit(api, existing + i)),
        });
      }
      if (!cancelled) {
        setGrants(out);
      }
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, decoded, sig.walletAddress]);

  // X12 (Preview): a TOTP code before signing calls that move at least the user's limit.
  const [mfa, setMfa] = useState<MfaStatus | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaErr, setMfaErr] = useState<string | null>(null);
  useEffect(() => {
    if (sig.authToken) {
      getMfaStatus(sig.authToken).then(setMfa);
    }
  }, [sig.authToken]);
  const mfaRequired = (() => {
    if (!mfa?.enabled || !decoded?.success) {
      return false;
    }
    const moved = movedRao(decoded.data.plain);
    return (
      moved.all ||
      mfa.threshold_rao === null ||
      moved.rao >= BigInt(mfa.threshold_rao)
    );
  })();

  const refusal =
    sig.apiState.status === "refused"
      ? sig.apiState.reason
      : !sig.signerMatches
        ? "This request is for a different account than your BitcodeX wallet."
        : decoded && !decoded.success
          ? decoded.err
          : null;
  const isApproveEnabled =
    !!api &&
    sig.hasKeys &&
    !!decoded?.success &&
    !refusal &&
    !sig.isLoading &&
    (!mfaRequired || /^\d{6}$/.test(mfaCode));

  async function onApprove() {
    if (getIsAborted() || !api || !decoded?.success) {
      return;
    }
    sig.setIsLoading(true);
    try {
      if (mfaRequired) {
        const err = sig.authToken
          ? await verifyMfaCode(sig.authToken, mfaCode)
          : "not signed in";
        if (err) {
          setMfaErr(err);
          return;
        }
        setMfaErr(null);
      }
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

          {grants.map((g) => (
            <SigSection key={g.proxyType} title={`Permission: ${g.proxyType}`}>
              {g.broad && (
                <DangerBox>
                  This is a broad permission. Only approve it for a key you
                  fully trust.
                </DangerBox>
              )}
              <SigRow
                label="The app will be able to"
                value={g.can.join("; ")}
              />
              <SigRow
                label="It will not be able to"
                value="do anything outside this list (the chain refuses it)"
              />
              <SigRow
                label="Deposit (returned when revoked)"
                value={g.deposit}
              />
              <SigRow
                label="Revoke"
                value="any time from your BitcodeX dashboard"
              />
            </SigSection>
          ))}

          {Object.keys(regCosts).length > 0 && (
            <SigSection title="Registration cost">
              {Object.entries(regCosts).map(([netuid, cost]) => (
                <SigRow
                  key={netuid}
                  label={`Subnet ${netuid}, if included in the next block`}
                  value={cost}
                />
              ))}
            </SigSection>
          )}

          {mfaRequired && (
            <SigSection title="Authenticator code (Preview)">
              <SigRow
                label="Why"
                value={
                  mfa?.threshold_rao === null
                    ? "you require a code for every signature"
                    : `this moves at least your limit of ${formatTao(BigInt(mfa?.threshold_rao ?? "0"))}`
                }
              />
              <input
                className={bt.mfaInput}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6-digit code"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
              />
              {mfaErr && <DangerBox>{mfaErr}</DangerBox>}
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
