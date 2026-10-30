"use client";

import type { FC, ReactNode } from "react";

import styles from "./btn.module.scss";

/** Monochrome demo button (same props the panels used from common-ui). */
export const Btn: FC<{
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}> = ({
  children,
  onClick,
  disabled,
  isLoading,
  variant = "primary",
  size = "md",
  fullWidth,
}) => (
  <button
    type="button"
    className={styles.btn}
    data-variant={variant}
    data-size={size}
    data-full={fullWidth ? "true" : undefined}
    disabled={disabled || isLoading}
    onClick={onClick}
  >
    {isLoading && <span className={styles.spin} aria-hidden="true" />}
    <span>{children}</span>
  </button>
);
