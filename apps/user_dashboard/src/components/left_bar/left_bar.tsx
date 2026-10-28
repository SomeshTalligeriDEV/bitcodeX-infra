"use client";

import { ExternalLinkOutlinedIcon } from "@bitcodex/bitcodex-common-ui/icons/external_link_outlined";
import { XCloseIcon } from "@bitcodex/bitcodex-common-ui/icons/x_close";
import { MenuItem } from "@bitcodex/bitcodex-common-ui/menu";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import cn from "classnames";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import { navigationItems } from "./constant";
import styles from "./left_bar.module.scss";
import {
  BITCODEX_FEATURE_REQUEST_ENDPOINT,
  BITCODEX_GET_SUPPORT_ENDPOINT,
} from "@bitcodex-user-dashboard/fetch";
import { useViewState } from "@bitcodex-user-dashboard/state/view";

const BITCODEX_LOGO_URL =
  "http://localhost:9000/bitcodex-assets/icons/bitcodex_logo.svg";

export const LeftBar: FC = () => {
  const isLeftBarOpen = useViewState((state) => state.isLeftBarOpen);
  const toggleLeftBarOpen = useViewState((state) => state.toggleLeftBarOpen);
  const setLeftBarOpen = useViewState((state) => state.setLeftBarOpen);
  const pathname = usePathname();

  const handleClose = () => {
    setLeftBarOpen(false);
  };

  return (
    <>
      <div
        className={cn(styles.overlay, { [styles.isOpen]: isLeftBarOpen })}
        onClick={toggleLeftBarOpen}
      />

      <div className={cn(styles.wrapper, { [styles.isOpen]: isLeftBarOpen })}>
        <div className={styles.header}>
          <img src={BITCODEX_LOGO_URL} alt="BitcodeX" width={72} height={28} />
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
          >
            <XCloseIcon size={24} color="var(--fg-primary)" />
          </button>
        </div>

        <ul className={styles.mainMenu}>
          {navigationItems.map((item) => (
            <MenuItem
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              active={pathname === item.href}
              onClick={handleClose}
            />
          ))}
        </ul>

        <div className={styles.footer}>
          <a
            href={BITCODEX_FEATURE_REQUEST_ENDPOINT}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerItem}
          >
            <Typography size="sm" weight="semibold" color="secondary">
              Feature Request
            </Typography>
            <ExternalLinkOutlinedIcon color="var(--fg-quaternary)" />
          </a>
          <a
            href={BITCODEX_GET_SUPPORT_ENDPOINT}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerItem}
          >
            <Typography size="sm" weight="semibold" color="secondary">
              Get Support
            </Typography>
            <ExternalLinkOutlinedIcon color="var(--fg-quaternary)" />
          </a>
        </div>
      </div>
    </>
  );
};
