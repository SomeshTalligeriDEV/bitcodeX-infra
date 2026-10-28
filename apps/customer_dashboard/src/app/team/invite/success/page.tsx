"use client";

import { Button } from "@bitcodex/bitcodex-common-ui/button";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useRouter } from "next/navigation";
import type { FC } from "react";

import styles from "./page.module.scss";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { paths } from "@bitcodex-ct-dashboard/paths";

const ILLUSTRATION_URL =
  "http://localhost:9000/bitcodex-assets/assets/invite_success.png";

const InviteSuccessPage: FC = () => {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <DashboardHeader />
      <div className={styles.body}>
        <div className={styles.content}>
          <img
            src={ILLUSTRATION_URL}
            alt="Password set illustration"
            width={320}
            height={240}
          />

          <Typography size="display-sm" weight="semibold" color="primary">
            You&apos;re all set 🎉
          </Typography>

          <Typography size="md" weight="medium" color="secondary">
            You can now log in with your email and password.
          </Typography>

          <Spacing height={40} />

          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => router.push(paths.sign_in)}
          >
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteSuccessPage;
