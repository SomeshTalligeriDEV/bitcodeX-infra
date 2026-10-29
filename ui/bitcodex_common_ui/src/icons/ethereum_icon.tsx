import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const EthereumIcon: FC<EthereumIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="Ethereum" width={width} height={height} />;
};

export interface EthereumIconProps {
  width?: number;
  height?: number;
}
