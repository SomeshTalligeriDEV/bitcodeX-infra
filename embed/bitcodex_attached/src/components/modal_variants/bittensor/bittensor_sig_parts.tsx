import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { FC, ReactNode } from "react";

import styles from "./bittensor_sig_modal.module.scss";
import type { DecodedCall } from "./decode";

export const SigSection: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <div className={styles.section}>
    <Typography size="xs" weight="medium" color="tertiary">
      {title}
    </Typography>
    {children}
  </div>
);

export const SigRow: FC<{ label: string; value: ReactNode }> = ({
  label,
  value,
}) => (
  <div className={styles.row}>
    <Typography size="sm" color="secondary">
      {label}
    </Typography>
    <Typography size="sm" weight="medium" color="primary">
      {value}
    </Typography>
  </div>
);

export const NetworkBadge: FC<{ name: string }> = ({ name }) => (
  <span className={styles.badge}>{name}</span>
);

export const DangerBox: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={styles.danger}>{children}</div>
);

export const CallView: FC<{ call: DecodedCall }> = ({ call }) => (
  <div>
    {!call.known && <DangerBox>Unknown call: check it carefully.</DangerBox>}
    <div className={styles.call}>
      {call.section}.{call.method}
    </div>
    <pre className={styles.args}>{JSON.stringify(call.args, null, 2)}</pre>
    {call.inner.length > 0 && (
      <div className={styles.inner}>
        {call.inner.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: calls have no identity besides position
          <CallView key={i} call={c} />
        ))}
      </div>
    )}
  </div>
);
