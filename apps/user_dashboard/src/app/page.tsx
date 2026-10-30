import styles from "./page.module.scss";
import { Authorized } from "@bitcodex-user-dashboard/components/authorized/authorized";
import { BittensorHome } from "@bitcodex-user-dashboard/components/bittensor/bittensor_home";
import { ConnectedApps } from "@bitcodex-user-dashboard/components/connected_apps/connected_apps";
import { DashboardBody } from "@bitcodex-user-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-user-dashboard/components/dashboard_header/dashboard_header";
import { KeyExportPromptModal } from "@bitcodex-user-dashboard/components/key_export_prompt_modal/key_export_prompt_modal";
import { LeftBar } from "@bitcodex-user-dashboard/components/left_bar/left_bar";
import { ToastContainer } from "@bitcodex-user-dashboard/components/toast";

export default function Home() {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <div className={styles.content}>
              {/* Bittensor only: the multi-chain TotalBalance/MyAssets views are hidden. */}
              <ConnectedApps />
              <BittensorHome />
            </div>
          </DashboardBody>
        </div>
      </div>
      <ToastContainer />
      <KeyExportPromptModal />
    </Authorized>
  );
}
