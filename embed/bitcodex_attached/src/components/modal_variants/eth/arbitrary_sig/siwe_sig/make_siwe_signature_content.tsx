import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import type { Theme } from "@bitcodex/bitcodex-common-ui/theme";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { EthereumArbitrarySignPayload } from "@bitcodex/bitcodex-sdk-core";
import type { FC } from "react";

import { Avatar } from "@bitcodex-attached/components/avatar/avatar";
import { MakeSignatureRawCodeBlock } from "@bitcodex-attached/components/modal_variants/common/make_signature/make_sig_modal_code_block";
import { MakeSignatureRawCodeBlockContainer } from "@bitcodex-attached/components/modal_variants/common/make_signature/make_sig_modal_code_block_container";
import { RiskWarningBox } from "@bitcodex-attached/components/modal_variants/common/risk_warning/risk_warning";
import styles from "@bitcodex-attached/components/modal_variants/common/sign_in_content/sign_in_content.module.scss";
import { SignerInfo } from "@bitcodex-attached/components/modal_variants/common/signer_info";
import { SiweSigTitleBadge } from "@bitcodex-attached/components/modal_variants/eth/arbitrary_sig/siwe_sig/siwe_sig_title_badge";
import {
  getSiweMessage,
  verifySiweMessage,
} from "@bitcodex-attached/components/modal_variants/eth/siwe_message";
import { useMemoryState } from "@bitcodex-attached/store/memory";

interface EthereumSiweSignatureContentProps {
  payload: EthereumArbitrarySignPayload;
  theme: Theme | null;
}

export const EthereumSiweSignatureContent: FC<
  EthereumSiweSignatureContentProps
> = ({ payload, theme }) => {
  const appName = useMemoryState((state) => state.appName);
  const message = getSiweMessage(payload.data.message);
  if (!message) {
    // @unreachable
    throw new Error("unreachable");
  }

  const isMobileNative = useMemoryState((state) => state.isMobileNative);
  const isValidSiweMessage = verifySiweMessage(message, payload.origin, {
    skipOriginCheck: isMobileNative,
  });

  return (
    <div>
      {isValidSiweMessage ? (
        <SiweSigTitleBadge theme={theme} />
      ) : (
        <RiskWarningBox />
      )}

      <div className={styles.metadataContainer}>
        <Spacing height={isValidSiweMessage ? 8 : 12} />
        <Typography size="lg" color="primary" weight="semibold">
          Sign in to
        </Typography>

        <Spacing height={4} />
        <div className={styles.originRow}>
          <Typography
            size="lg"
            color={isValidSiweMessage ? "primary" : "warning-primary"}
            weight="semibold"
          >
            {appName}
          </Typography>
        </div>

        <Spacing height={8} />
        <SignerInfo signer={payload.signer} initialViewType="Login Info" />
      </div>

      <Spacing height={20} />

      <div className={styles.chainInfoContainer}>
        <div className={styles.chainInfoRow}>
          <Typography size="xs" color="secondary" weight="semibold">
            Impact on balance
          </Typography>
          <Typography size="sm" color="secondary" weight="medium">
            None
          </Typography>
        </div>

        <Spacing height={8} />
        <div className={styles.chainInfoRow}>
          <Typography size="xs" color="secondary" weight="semibold">
            Network
          </Typography>

          <div className={styles.chainInfoRowContent}>
            <Avatar
              src={payload.chain_info.chain_symbol_image_url}
              alt="chain icon"
              size="sm"
              variant="rounded"
            />
            <Typography size="sm" color="secondary" weight="medium">
              {payload.chain_info.chain_name}
            </Typography>
          </div>
        </div>
      </div>

      <Spacing height={16} />
      <MakeSignatureRawCodeBlockContainer className={styles.messageContainer}>
        <Typography color="tertiary" size="xs" weight="semibold">
          Message
        </Typography>

        <Spacing height={16} />
        <MakeSignatureRawCodeBlock
          code={message.statement ?? ""}
          className={styles.messageContent}
        />
      </MakeSignatureRawCodeBlockContainer>
    </div>
  );
};
