import type { CSSProperties, FC } from "react";

/**
 * Neutral stand-in for third-party chain/wallet logos: BitcodeX is Bittensor only and the
 * product UI must not show third-party logos, so no image is fetched for these.
 */
export const LetterBadge: FC<{
  label: string;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
}> = ({ label, width = 16, height = 16, style }) => {
  const size = typeof width === "number" ? width : 16;
  return (
    <span
      aria-label={label}
      style={{
        display: "inline-grid",
        placeItems: "center",
        width,
        height,
        borderRadius: 999,
        background: "var(--bg-tertiary, #e4e7ec)",
        color: "var(--fg-secondary, #344054)",
        fontSize: Math.max(8, Math.round(size * 0.5)),
        fontWeight: 700,
        lineHeight: 1,
        flex: "none",
        ...style,
      }}
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
};
