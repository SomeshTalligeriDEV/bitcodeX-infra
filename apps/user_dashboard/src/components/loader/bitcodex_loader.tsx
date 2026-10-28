import cn from "classnames";
import Image from "next/image";
import type { FC } from "react";

import styles from "./bitcodex_loader.module.scss";

interface BitcodeXLoaderProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const BitcodeXLoader: FC<BitcodeXLoaderProps> = ({
  size = 80,
  className,
}) => {
  const iconSize = (size / 80) * 28;
  return (
    <div className={cn(styles.container, className)}>
      <div
        className={styles.spinnerContainer}
        style={{ width: size, height: size }}
      >
        <Image
          src="/bitcodex_loader_mask.svg"
          alt="loading mask"
          fill
          className={styles.colorWheel}
          priority
        />
        <div
          className={styles.iconWrapper}
          style={{ width: iconSize, height: iconSize }}
        >
          <Image
            src="/bitcodex_loader_icon.svg"
            alt="loading icon"
            fill
            className={styles.icon}
            priority
          />
        </div>
      </div>
      <span className={styles.loadingText}>LOADING</span>
    </div>
  );
};
