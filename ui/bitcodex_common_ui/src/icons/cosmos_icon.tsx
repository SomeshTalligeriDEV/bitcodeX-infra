import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const CosmosIcon: FC<CosmosIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Cosmos" width={width} height={height} />;
};

export interface CosmosIconProps {
  width?: number;
  height?: number;
}
