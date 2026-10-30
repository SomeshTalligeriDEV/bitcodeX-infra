import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const OsmosisIcon: FC<OsmosisIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Osmosis" width={width} height={height} />;
};

export interface OsmosisIconProps {
  width?: number;
  height?: number;
}
