import { Logo } from "@bitcodex/bitcodex-common-ui/logo";
import type { FC } from "react";

import styles from "./global_header.module.scss";

export const GlobalHeader: FC = () => {
  return (
    <div className={styles.wrapper}>
      {/* NOTE: theme is hardcoded to light for now */}
      <Logo theme={"light"} />
    </div>
  );
};
