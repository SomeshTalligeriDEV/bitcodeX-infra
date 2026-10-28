"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { SettingIcon } from "@bitcodex/bitcodex-common-ui/icons/setting_icon";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { FC } from "react";

import { TokenList } from "./components/token_list/token_list";
import styles from "./my_assets.module.scss";
import { ShowHideChainsModal } from "@bitcodex-user-dashboard/components/show_hide_chains_modal/show_hide_chains_modal";

export const MyAssets: FC = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Typography tagType="h1" size="xl" weight="semibold" color="primary">
          My Assets
        </Typography>

        <ShowHideChainsModal
          renderTrigger={({ onOpen }) => (
            <Button variant="ghost" onClick={onOpen}>
              <SettingIcon size={16} color="var(--fg-quaternary)" />
              <Typography size="sm" weight="semibold" color="tertiary">
                Show/Hide Chains
              </Typography>
            </Button>
          )}
        />
      </div>

      <TokenList />
    </div>
  );
};
