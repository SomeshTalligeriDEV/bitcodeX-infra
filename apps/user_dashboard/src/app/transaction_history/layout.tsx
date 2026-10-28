import type { ReactNode } from "react";

import "@bitcodex/bitcodex-common-ui/styles/colors.scss";
import "@bitcodex/bitcodex-common-ui/styles/typography.scss";
import "@bitcodex/bitcodex-common-ui/styles/shadow.scss";
import "@bitcodex/bitcodex-common-ui/styles/animation.scss";

import { Authorized } from "@bitcodex-user-dashboard/components/authorized/authorized";
import { DashboardBody } from "@bitcodex-user-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-user-dashboard/components/dashboard_header/dashboard_header";
import { LeftBar } from "@bitcodex-user-dashboard/components/left_bar/left_bar";
import styles from "@bitcodex-user-dashboard/styles/layout_with_left_bar.module.scss";

export default function TransactionHistoryLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <div className={styles.content}>{children}</div>
          </DashboardBody>
        </div>
      </div>
    </Authorized>
  );
}
