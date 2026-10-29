import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const RialoIcon: FC<RialoIconProps> = ({ width = 16, height = 16 }) => {
  return <LetterBadge label="Rialo" width={width} height={height} />;
};

export interface RialoIconProps {
  width?: number;
  height?: number;
}
