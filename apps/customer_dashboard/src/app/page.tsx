import styles from "./page.module.scss";
import { AccountInfo } from "@bitcodex-ct-dashboard/components/account_info/account_info";
// import { SDKInstallationGuide } from "@bitcodex-ct-dashboard/components/sdk_installation_guide/sdk_installation_guide";
import { APIKeyList } from "@bitcodex-ct-dashboard/components/api_key_list/api_key_list";
import { Authorized } from "@bitcodex-ct-dashboard/components/authorized/authorized";
import { DashboardBody } from "@bitcodex-ct-dashboard/components/dashboard_body/dashboard_body";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { HomeBanner } from "@bitcodex-ct-dashboard/components/home_banner/home_banner";
import { LeftBar } from "@bitcodex-ct-dashboard/components/left_bar/left_bar";
import { ToastContainer } from "@bitcodex-ct-dashboard/components/toast";

export default function Home() {
  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <LeftBar />
          <DashboardBody>
            <AccountInfo />
            <div className={styles.homeBanners}>
              <HomeBanner
                title="Read our docs"
                description="Everything you need to get started with BitcodeX."
                buttonText="Open Docs"
                buttonLink={process.env.NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT}
                type="docs"
              />
              <HomeBanner
                title="See it in action"
                description="Try and explore BitcodeX in a live demo."
                buttonText="Try Demo"
                buttonLink={process.env.NEXT_PUBLIC_BITCODEX_DEMO_ENDPOINT}
                type="demo"
              />
            </div>
            {/* TODO: @Ryz0nd, @lidarbtc */}
            {/* <SDKInstallationGuide /> */}
            <APIKeyList />
            <ToastContainer />
          </DashboardBody>
        </div>
      </div>
    </Authorized>
  );
}
