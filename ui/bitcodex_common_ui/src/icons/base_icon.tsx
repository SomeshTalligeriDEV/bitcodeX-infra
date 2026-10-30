import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const BaseIcon: FC<BaseIconProps> = ({ width = 16, height = 16 }) => {
  return <LetterBadge label="Base" width={width} height={height} />;
};

export interface BaseIconProps {
  width?: number;
  height?: number;
}
