import type React from "react";

import { LetterBadge } from "./letter_badge";

export const SolanaIcon: React.FC<SolanaIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Solana" width={width} height={height} />;
};

export interface SolanaIconProps {
  width?: number;
  height?: number;
}
