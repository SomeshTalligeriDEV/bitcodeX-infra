import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const LeapIcon: FC<LeapIconProps> = ({ width = 20, height = 20 }) => {
  return <LetterBadge label="Leap" width={width} height={height} />;
};

export interface LeapIconProps {
  width?: number;
  height?: number;
}
