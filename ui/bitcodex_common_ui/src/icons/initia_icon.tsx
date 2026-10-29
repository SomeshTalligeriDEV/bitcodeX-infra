import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const InitiaIcon: FC<InitiaIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Initia" width={width} height={height} />;
};

export interface InitiaIconProps {
  width?: number;
  height?: number;
}
