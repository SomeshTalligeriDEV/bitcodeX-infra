"use client";

import { Badge } from "@bitcodex/bitcodex-common-ui/badge";
import { AlertTriangleIcon } from "@bitcodex/bitcodex-common-ui/icons/alert_triangle_icon";
import { HomeOutlinedIcon } from "@bitcodex/bitcodex-common-ui/icons/home_outlined";
import { UsersIcon } from "@bitcodex/bitcodex-common-ui/icons/users";
import { MenuItem } from "@bitcodex/bitcodex-common-ui/menu";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { AccountInfoWithSubMenu } from "../account_info_with_sub_menu/account_info_with_sub_menu";
import { ExternalLinkItem } from "../external_link_item/external_link_item";
import styles from "./left_bar.module.scss";
import { useTeamMembers } from "@bitcodex-ct-dashboard/hooks/use_team_members";
import { paths } from "@bitcodex-ct-dashboard/paths";

export const LeftBar: FC = () => {
  const pathname = usePathname();
  const { data: teamData } = useTeamMembers();

  const teamMemberCount =
    teamData !== null && teamData !== undefined
      ? teamData.total + teamData.pending_invitations.length
      : null;

  return (
    <div className={styles.wrapper}>
      <ul className={styles.mainMenu}>
        <MenuItem
          href={paths.home}
          label="Home"
          Icon={
            <HomeOutlinedIcon color="var(--gray-400)" className={styles.icon} />
          }
          active={pathname === paths.home}
        />
        <div className={styles.menuItemWithBadge}>
          <MenuItem
            href={paths.team}
            label="Team"
            Icon={<UsersIcon color="var(--gray-400)" className={styles.icon} />}
            active={pathname === paths.team}
          />
          <Badge
            color="gray"
            label={teamMemberCount !== null ? String(teamMemberCount) : "–"}
            size="sm"
          />
        </div>
      </ul>

      <div className={styles.subMenu}>
        <div className={styles.shutdownNotice}>
          <div className={styles.shutdownNoticeHeader}>
            <AlertTriangleIcon size={14} color="#dc6803" />
            <span className={styles.shutdownNoticeTitle}>Important Notice</span>
          </div>
          <p className={styles.shutdownNoticeBody}>
            BitcodeX is shutting down on June 1, 2026. Please remove BitcodeX
            from your dapp and inform your users to export their private keys.
          </p>
        </div>

        <AccountInfoWithSubMenu />

        <div>
          <ExternalLinkItem
            href={process.env.NEXT_PUBLIC_BITCODEX_FEATURE_REQUEST_ENDPOINT}
          >
            Feature Request
          </ExternalLinkItem>

          <ExternalLinkItem
            href={process.env.NEXT_PUBLIC_BITCODEX_GET_SUPPORT_ENDPOINT}
          >
            Get Support
          </ExternalLinkItem>
        </div>
      </div>
    </div>
  );
};
