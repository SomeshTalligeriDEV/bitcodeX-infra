import type React from "react";
import type { FC } from "react";

export const LogoTextIcon: FC<LogoTextIconProps> = ({
  width = 54.231,
  height = "auto",
  style,
}) => {
  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: "-0.01em",
        color: "var(--fg-primary, #101828)",
        width,
        height,
        ...(style ?? { paddingTop: "6px" }),
      }}
    >
      BitcodeX
    </span>
  );
};

export interface LogoTextIconProps {
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}
