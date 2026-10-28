import styles from "./page.module.scss";
import { InvalidLink } from "@bitcodex-ct-dashboard/components/invalid_link/invalid_link";

export default function InvalidInvitePage() {
  return (
    <div className={styles.wrapper}>
      <InvalidLink />
    </div>
  );
}
