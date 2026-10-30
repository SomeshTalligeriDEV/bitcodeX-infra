"use client";

import { type FC, useState } from "react";

import styles from "./docs.module.scss";

export const CodeBlock: FC<{ code: string; lang?: string; title?: string }> = ({
  code,
  lang = "tsx",
  title,
}) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // select-and-copy still works
    }
  };
  return (
    <figure className={styles.code}>
      <figcaption>
        <span>{title ?? lang}</span>
        <button type="button" onClick={copy}>
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  );
};
