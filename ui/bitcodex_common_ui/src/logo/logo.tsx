import type { FC } from "react";

import styles from "./logo.module.scss";
import { BitcodeXLogoIcon } from "@bitcodex-common-ui/icons/bitcodex_logo_icon";
import type { Theme } from "@bitcodex-common-ui/theme/theme_provider";

export interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  theme?: Theme | null;
}

export const Logo: FC<LogoProps> = ({
  width = 72,
  height = 28,
  className,
  theme,
}) => {
  return (
    <div className={styles.logoContainer}>
      <BitcodeXLogoIcon
        width={width}
        height={height}
        className={className}
        theme={theme}
      />
    </div>
  );
};
