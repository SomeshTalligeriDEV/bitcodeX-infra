"use client";

import { ChevronLeftIcon } from "@bitcodex/bitcodex-common-ui/icons/chevron_left";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import cn from "classnames";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import styles from "./page.module.scss";
import { Authorized } from "@bitcodex-ct-dashboard/components/authorized/authorized";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { ResetPassword } from "@bitcodex-ct-dashboard/components/reset_password/reset_password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isAfterLogin, setIsAfterLogin] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const afterLogin = urlParams.get("after_login") === "true";
    setIsAfterLogin(afterLogin);
  }, []);

  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={cn(styles.body, { [styles.afterLogin]: isAfterLogin })}>
          {isAfterLogin && (
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.back()}
            >
              <ChevronLeftIcon size={24} color="var(--fg-tertiary)" />
            </button>
          )}

          <Typography
            tagType="h1"
            size="display-sm"
            weight="semibold"
            color="primary"
          >
            {isAfterLogin ? "Change" : "Reset"} Password
          </Typography>
          <Spacing height={8} />

          <Typography
            size="md"
            weight="regular"
            color="secondary"
            className={styles.description}
          >
            Time for a fresh, secure password
          </Typography>

          <ResetPassword isAfterLogin={isAfterLogin} />
        </div>
      </div>
    </Authorized>
  );
}
