import { ImageWithAlt } from "@bitcodex/bitcodex-common-ui/image_with_alt";
import type { Theme } from "@bitcodex/bitcodex-common-ui/theme";
import type { FC } from "react";

import styles from "./styles.module.scss";
import { BITCODEX_PUBLIC_S3_BUCKET_URL } from "@bitcodex-attached/requests/endpoints";

interface SiweSigTitleBadgeProps {
  theme: Theme | null;
}
export const SiweSigTitleBadge: FC<SiweSigTitleBadgeProps> = ({ theme }) => {
  const imageUrl = {
    png:
      theme === "dark"
        ? `${BITCODEX_PUBLIC_S3_BUCKET_URL}/assets/bitcodex_siwe_sign_badge_dark.png`
        : `${BITCODEX_PUBLIC_S3_BUCKET_URL}/assets/bitcodex_siwe_sign_badge_light.png`,
    webp:
      theme === "dark"
        ? `${BITCODEX_PUBLIC_S3_BUCKET_URL}/assets/bitcodex_siwe_sign_badge_dark.webp`
        : `${BITCODEX_PUBLIC_S3_BUCKET_URL}/assets/bitcodex_siwe_sign_badge_light.webp`,
  };

  return (
    <div className={styles.imageContainer}>
      <ImageWithAlt
        srcSet={imageUrl.webp}
        srcAlt={imageUrl.png}
        alt="sign siwe title image"
        className={styles.image}
      />
    </div>
  );
};
