"use client";

import { ErrorIcon } from "@bitcodex/bitcodex-common-ui/icons/error_icon";
import { ExternalLinkOutlinedIcon } from "@bitcodex/bitcodex-common-ui/icons/external_link_outlined";
import { LoadingIcon } from "@bitcodex/bitcodex-common-ui/icons/loading";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { FC } from "react";

import styles from "@bitcodex-attached/components/google_callback/google_callback.module.scss";
import { useXCallback } from "@bitcodex-attached/components/x_callback/use_callback";
import { useSetThemeInCallback } from "@bitcodex-attached/hooks/theme";
import { BitcodeXLogoIcon } from "@bitcodex-common-ui/icons/bitcodex_logo_icon";

export const XCallback: FC = () => {
  const theme = useSetThemeInCallback("x");
  const { error } = useXCallback();

  return (
    <div className={`${styles.wrapper} ${styles.wrapperForSystemTheme}`}>
      <BitcodeXLogoIcon width={115} height={44} theme={theme} />
      <Spacing height={56} />
      {error ? (
        <ErrorMessage error={error} />
      ) : (
        <>
          <LoadingIcon
            size={50}
            className={styles.loadingIcon}
            backgroundColor="var(--bg-tertiary)"
            color="var(--fg-brand-primary)"
          />
          <Spacing height={19} />

          <Typography size="lg" weight="medium" color="secondary">
            Redirecting...
          </Typography>
        </>
      )}
      <Spacing height={60} />
    </div>
  );
};

const ErrorMessage: FC<{ error: string }> = ({ error }) => {
  const errorCode = error || "unknown_error";
  const isParamsNotSufficient = errorCode === "params_not_sufficient";
  const errorMessage = isParamsNotSufficient
    ? `Error Code: ${errorCode}\n\nFailed to get the required information from X. Please contact BitcodeX for support.`
    : `Error Code: ${errorCode}`;

  return (
    <>
      <div className={styles.errorIconContainer}>
        <div className={styles.ring1} />
        <div className={styles.ring2} />
        <ErrorIcon size={28} color="var(--fg-error-primary)" />
      </div>
      <Spacing height={32} />

      <a
        href="https://bitcodexwallet.userjot.com/board/report-bugs"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.supportLink}
      >
        <Typography size="sm" weight="medium" color="secondary">
          Having problems?
        </Typography>
        <Typography
          className={styles.textUnderline}
          size="sm"
          weight="medium"
          color="secondary"
        >
          Get support
        </Typography>
        <ExternalLinkOutlinedIcon color="var(--fg-quaternary-hover)" />
      </a>

      <Spacing height={32} />
      <div className={styles.errorMessageContainer}>
        <Typography size="sm" weight="medium" color="error-primary">
          {errorMessage}
        </Typography>
      </div>
    </>
  );
};
