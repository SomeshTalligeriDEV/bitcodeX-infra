import styles from "../team/page.module.scss";
import { AppsManager } from "@bitcodex-ct-dashboard/components/apps_manager/apps_manager";
import { Authorized } from "@bitcodex-ct-dashboard/components/authorized/authorized";
import { DashboardBody } from "@bitcodex-ct-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { LeftBar } from "@bitcodex-ct-dashboard/components/left_bar/left_bar";
import { ToastContainer } from "@bitcodex-ct-dashboard/components/toast";

export default function AppsPage() {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <AppsManager />
            <ToastContainer />
          </DashboardBody>
        </div>
      </div>
    </Authorized>
  );
}
