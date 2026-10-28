import { Logo } from "@bitcodex/bitcodex-common-ui/logo";
import Link from "next/link";
import type { FC } from "react";

import styles from "./dashboard_header.module.scss";
import { paths } from "@bitcodex-ct-dashboard/paths";

export const DashboardHeader: FC = () => {
  return (
    <div className={styles.wrapper}>
      <Link href={paths.home}>
        <Logo theme="light" />
      </Link>
    </div>
  );
};
