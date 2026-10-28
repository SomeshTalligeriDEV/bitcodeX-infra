import styles from "./page.module.scss";
import { Authorized } from "@bitcodex-ct-dashboard/components/authorized/authorized";
import { DashboardBody } from "@bitcodex-ct-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { LeftBar } from "@bitcodex-ct-dashboard/components/left_bar/left_bar";
import { TeamMemberList } from "@bitcodex-ct-dashboard/components/team_member_list/team_member_list";
import { ToastContainer } from "@bitcodex-ct-dashboard/components/toast";

export default function TeamPage() {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <TeamMemberList />
            <ToastContainer />
          </DashboardBody>
        </div>
      </div>
    </Authorized>
  );
}
