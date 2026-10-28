import { CloseButtonIcon } from "@bitcodex/bitcodex-common-ui/icons/close_button_icon";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { FC } from "react";

import styles from "./integration_card.module.scss";

interface IntegrationCardProps {
  onClose: () => void;
}

export const IntegrationCard: FC<IntegrationCardProps> = ({ onClose }) => {
  return (
    <div className={styles.container}>
      <button
        className={styles.closeButton}
        type="button"
        aria-label="Close"
        onClick={onClose}
      >
        <CloseButtonIcon size={12} />
      </button>
      <div className={styles.titleRow}>
        <Typography size="sm" weight="semibold" color="primary">
          Integrate Officially!
        </Typography>
      </div>
      <Typography
        size="sm"
        weight="regular"
        color="tertiary"
        className={styles.description}
      >
        Get BitcodeX’s managed infra and production support with official
        integration.
      </Typography>

      <img
        src={`${process.env.NEXT_PUBLIC_S3_BUCKET_URL}/assets/bitcodex-demo-intergrate-officially.png`}
        className={styles.image}
        alt=""
      />
    </div>
  );
};
