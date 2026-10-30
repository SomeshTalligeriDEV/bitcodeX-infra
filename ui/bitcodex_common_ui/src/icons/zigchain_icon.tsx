import type { FC } from "react";

import { LetterBadge } from "./letter_badge";

export const ZigchainIcon: FC<ZigchainIconProps> = ({
  width = 16,
  height = 16,
}) => {
  return <LetterBadge label="ZigChain" width={width} height={height} />;
};

export interface ZigchainIconProps {
  width?: number;
  height?: number;
}
