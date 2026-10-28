import { Typography } from "@bitcodex/bitcodex-common-ui/typography";
import type { CallCard } from "@bitcodex/bittensor-chain";
import type { FC, ReactNode } from "react";

import styles from "./bittensor_sig_modal.module.scss";

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

/** One call card; unknown calls show section.method and raw args under a red warning. */
export const CallView: FC<{ card: CallCard }> = ({ card }) => (
  <div className={styles.card}>
    {card.danger && <DangerBox>{card.danger}</DangerBox>}
    <div className={styles.cardTitle}>
      <Typography size="sm" weight="semibold" color="primary">
        {card.title}
      </Typography>
      {card.known && (
        <span className={styles.callName}>
          {card.section}.{card.method}
        </span>
      )}
    </div>
    {card.rows.map((row) => (
      <SigRow
        key={row.label}
        label={row.label}
        value={
          row.mono ? (
            <span className={styles.mono}>{row.value}</span>
          ) : (
            row.value
          )
        }
      />
    ))}
    {card.inner.length > 0 && (
      <div className={styles.inner}>
        {card.inner.map((c, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: calls have no identity besides position
          <CallView key={i} card={c} />
        ))}
      </div>
    )}
  </div>
);
