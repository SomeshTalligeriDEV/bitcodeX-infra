import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const MetamaskIcon: FC<MetamaskIconProps> = ({
  width = 20,
  height = 20,
}) => {
  return <LetterBadge label="MetaMask" width={width} height={height} />;
};

export interface MetamaskIconProps {
  width?: number;
  height?: number;
}
