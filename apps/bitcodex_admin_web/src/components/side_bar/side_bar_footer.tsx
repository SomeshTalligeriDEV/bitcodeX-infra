"use client";

import { AnchoredMenu } from "@bitcodex/bitcodex-common-ui/anchored_menu";
import { LogoutIcon } from "@bitcodex/bitcodex-common-ui/icons/logout";
import { ThreeDotsVerticalIcon } from "@bitcodex/bitcodex-common-ui/icons/three_dots_vertical";
import { SidebarAccountInfo } from "@bitcodex/bitcodex-common-ui/sidebar_account_info";
import type { FC } from "react";

import { useLogin } from "../login/use_login";
import styles from "./side_bar_footer.module.scss";
import { useAppState } from "@bitcodex-admin/state";

export const SideBarFooter: FC = () => {
  const { logout } = useLogin();
  const { user } = useAppState();

  return (
    <div className={styles.wrapper}>
      <AnchoredMenu
        placement="right-start"
        TriggerComponent={
          <SidebarAccountInfo
            email={user?.email ?? ""}
            label={user?.role ?? ""}
            TopRightIcon={
              <span className={styles.iconWrapper}>
                <ThreeDotsVerticalIcon color="var(--fg-quaternary)" size={16} />
              </span>
            }
          />
        }
        menuItems={[
          {
            id: "sign-out",
            label: "Sign Out",
            icon: <LogoutIcon size={16} />,
            onClick: logout,
          },
        ]}
        className={styles.menu}
      />
    </div>
  );
};
