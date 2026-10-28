import styles from "./page.module.scss";
import { Authorized } from "@bitcodex-user-dashboard/components/authorized/authorized";
import { ConnectedApps } from "@bitcodex-user-dashboard/components/connected_apps/connected_apps";
import { DashboardBody } from "@bitcodex-user-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-user-dashboard/components/dashboard_header/dashboard_header";
import { KeyExportPromptModal } from "@bitcodex-user-dashboard/components/key_export_prompt_modal/key_export_prompt_modal";
import { LeftBar } from "@bitcodex-user-dashboard/components/left_bar/left_bar";
import { MyAssets } from "@bitcodex-user-dashboard/components/my_assets/my_assets";
import { ToastContainer } from "@bitcodex-user-dashboard/components/toast";
import { TotalBalance } from "@bitcodex-user-dashboard/components/total_balance/total_balance";

export default function Home() {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <div className={styles.content}>
              <ConnectedApps />
              <TotalBalance />
              <MyAssets />
            </div>
          </DashboardBody>
        </div>
      </div>
      <ToastContainer />
      <KeyExportPromptModal />
    </Authorized>
  );
}
