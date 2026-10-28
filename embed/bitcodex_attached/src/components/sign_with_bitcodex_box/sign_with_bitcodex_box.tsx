import type { Theme } from "@bitcodex/bitcodex-common-ui/theme";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { FC } from "react";

import styles from "./sign_with_bitcodex_box.module.scss";
import { useMobileMode } from "@bitcodex-attached/hooks/mobile_mode";
import { isDemoOrSandboxOrigin } from "@bitcodex-attached/requests/endpoints";
import { useMemoryState } from "@bitcodex-attached/store/memory";
import { BitcodeXLogoWithNameIcon } from "@bitcodex-common-ui/icons/bitcodex_logo_with_name_icon";

const BACKUP_URL = "http://localhost:3206/export_private_key";

export const SignWithBitcodeXBox: FC<SignWithBitcodeXBoxProps> = ({
  theme,
  hideText,
}) => {
  const isMobile = useMobileMode();
  const hostOrigin = useMemoryState((s) => s.hostOrigin);
  const isMobileNative = useMemoryState((s) => s.isMobileNative);
  const mobileApiKey = useMemoryState((s) => s.apiKey);
  const isDemo =
    hostOrigin !== null &&
    isDemoOrSandboxOrigin(hostOrigin, {
      isMobileNative,
      apiKey: mobileApiKey,
    });
  const showBackupLink = !hideText && !isDemo;

  return (
    <div className={styles.container}>
      {showBackupLink && (
        <span className={styles.shutdownNotice}>
          BitcodeX shuts down Jun 1, 2026.
        </span>
      )}
      <div className={styles.signRow}>
        <div className={styles.signWithSection}>
          {!hideText && (
            <Typography
              size={isMobile ? "sm" : "xs"}
              color="quaternary"
              weight="medium"
            >
              Sign with
            </Typography>
          )}
          <div className={styles.logoContainer}>
            <BitcodeXLogoWithNameIcon
              width={isMobile ? 52 : 39}
              height={isMobile ? 20 : 16}
              theme={theme}
            />
          </div>
        </div>

        {showBackupLink && (
          <a
            href={BACKUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.backupLink}
          >
            Export your private key →
          </a>
        )}
      </div>
    </div>
  );
};

export interface SignWithBitcodeXBoxProps {
  theme: Theme | null;
  hideText?: boolean;
}
