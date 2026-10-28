"use client";

import { ChevronLeftIcon } from "@bitcodex/bitcodex-common-ui/icons/chevron_left";
import { Spacing } from "@bitcodex/bitcodex-common-ui/spacing";
import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import { useRouter } from "next/navigation";

import styles from "./page.module.scss";
import { Authorized } from "@bitcodex-ct-dashboard/components/authorized/authorized";
import { DashboardHeader } from "@bitcodex-ct-dashboard/components/dashboard_header/dashboard_header";
import { EditInfoForm } from "@bitcodex-ct-dashboard/components/edit_info_form/edit_info_form";

export default function EditInfoPage() {
  const router = useRouter();

  return (
    <Authorized>
      <div className={styles.wrapper}>
        <DashboardHeader />
        <div className={styles.body}>
          <button
            type="button"
            className={styles.backButton}
            onClick={() => router.back()}
          >
            <ChevronLeftIcon size={24} color="var(--fg-tertiary)" />
          </button>

          <Typography
            tagType="h1"
            size="display-sm"
            weight="semibold"
            color="primary"
          >
            Edit App Information
          </Typography>
          <Spacing height={8} />

          <Typography
            size="md"
            weight="medium"
            color="secondary"
            className={styles.description}
          >
            Update your app name and logo
          </Typography>

          <EditInfoForm />
        </div>
      </div>
    </Authorized>
  );
}
