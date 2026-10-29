import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const ArbitrumIcon: FC<ArbitrumIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Arbitrum" width={width} height={height} />;
};

export interface ArbitrumIconProps {
  width?: number;
  height?: number;
}
