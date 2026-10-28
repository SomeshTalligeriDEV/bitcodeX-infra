import type { FC, ReactNode } from "react";

import styles from "./sign_in_image.module.scss";
import { S3_BUCKET_URL } from "@bitcodex-user-dashboard/fetch";

export interface SignInImageProps {
  children?: ReactNode;
}

export const SignInImage: FC<SignInImageProps> = ({ children }) => (
  <div
    className={styles.container}
    style={{
      backgroundImage: `url(${S3_BUCKET_URL}/assets/bitcodex-user-dashboard-login.png)`,
    }}
  >
    {children}
  </div>
);
