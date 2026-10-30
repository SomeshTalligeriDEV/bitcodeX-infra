"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { FC } from "react";

import styles from "./docs.module.scss";
import { DOCS_FLAT, DOCS_NAV } from "./nav";

export const DocsSidebar: FC = () => {
  const path = usePathname().replace(/\/$/, "") || "/docs";
  return (
    <nav className={styles.sidebar} aria-label="Documentation">
      {DOCS_NAV.map((s) => (
        <div key={s.section} className={styles.navSection}>
          <span className={styles.navLabel}>{s.section}</span>
          {s.links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={styles.navLink}
              data-active={path === l.href}
            >
              {l.title}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
};

/** Previous / next links at the bottom of each page. */
export const DocsPager: FC = () => {
  const path = usePathname().replace(/\/$/, "") || "/docs";
  const i = DOCS_FLAT.findIndex((l) => l.href === path);
  const prev = i > 0 ? DOCS_FLAT[i - 1] : null;
  const next = i >= 0 && i < DOCS_FLAT.length - 1 ? DOCS_FLAT[i + 1] : null;
  return (
    <div className={styles.pager}>
      {prev ? (
        <Link href={prev.href}>
          <small>Previous</small>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} data-next="true">
          <small>Next</small>
          {next.title}
        </Link>
      )}
    </div>
  );
};
