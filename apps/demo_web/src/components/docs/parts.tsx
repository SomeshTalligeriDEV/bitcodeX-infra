import Link from "next/link";
import type { FC, ReactNode } from "react";

import styles from "./docs.module.scss";

export const Lead: FC<{ children: ReactNode }> = ({ children }) => (
  <p className={styles.lead}>{children}</p>
);

export const Callout: FC<{ kind?: "note" | "warn"; children: ReactNode }> = ({
  kind = "note",
  children,
}) => (
  <div className={styles.callout} data-kind={kind}>
    <p>{children}</p>
  </div>
);

export const Cards: FC<{ children: ReactNode }> = ({ children }) => (
  <div className={styles.cards}>{children}</div>
);

export const DocCard: FC<{
  href: string;
  title: string;
  children: ReactNode;
}> = ({ href, title, children }) => (
  <Link href={href} className={styles.card}>
    <strong>{title} →</strong>
    <span>{children}</span>
  </Link>
);

export const Pill: FC<{
  kind: "real" | "preview" | "no";
  children: ReactNode;
}> = ({ kind, children }) => (
  <span className={styles.pill} data-kind={kind}>
    {children}
  </span>
);
