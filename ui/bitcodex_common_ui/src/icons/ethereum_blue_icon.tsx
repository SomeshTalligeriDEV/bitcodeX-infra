import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const EthereumBlueIcon: FC<EthereumBlueIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Ethereum" width={width} height={height} />;
};

export interface EthereumBlueIconProps {
  width?: number;
  height?: number;
}
