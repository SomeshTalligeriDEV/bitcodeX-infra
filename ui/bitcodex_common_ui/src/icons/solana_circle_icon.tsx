import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const SolanaCircleIcon: FC<SolanaCircleIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Solana" width={width} height={height} />;
};

export interface SolanaCircleIconProps {
  width?: number;
  height?: number;
}
