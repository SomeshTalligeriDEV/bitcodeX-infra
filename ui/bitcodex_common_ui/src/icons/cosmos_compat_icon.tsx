import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const CosmosCompatIcon: FC<CosmosCompatIconProps> = ({
  width = 20,
  height = 20,
}) => {
  return <LetterBadge label="Keplr" width={width} height={height} />;
};

export interface CosmosCompatIconProps {
  width?: number;
  height?: number;
}
