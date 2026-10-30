import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import styles from "@bitcodex-demo-web/components/docs/docs.module.scss";
import {
  DocsPager,
  DocsSidebar,
} from "@bitcodex-demo-web/components/docs/docs_nav";
import { ThemeButton } from "@bitcodex-demo-web/components/theme/theme_button";

export const metadata: Metadata = {
  title: "BitcodeX Docs: embedded wallets for Bittensor",
  description:
    "Add a Bittensor wallet to your app: sign-in with Google or a wallet, user-approved signing, staking and hotkeys. SDK, server and self-host guides.",
};

const REPO = "https://github.com/SomeshTalligeriDEV/bitcodeX-infra";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark}>B</span>
          BitcodeX
          <span className={styles.tag}>Docs</span>
        </Link>
        <span className={styles.spacer} />
        <Link href="/" className={styles.headLink}>
          Live demo
        </Link>
        <a
          className={styles.headLink}
          href={REPO}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <ThemeButton />
      </header>
      <div className={styles.body}>
        <DocsSidebar />
        <main className={styles.content}>
          <article>{children}</article>
          <DocsPager />
        </main>
      </div>
    </div>
  );
}
