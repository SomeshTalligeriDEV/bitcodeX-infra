import type { FC } from "react";

import type { Theme } from "@bitcodex-common-ui/theme/theme_provider";

export interface BitcodeXLogoWithNameIconProps {
  width?: number;
  height?: number;
  className?: string;
  theme?: Theme | null;
}

export const BitcodeXLogoWithNameIcon: FC<BitcodeXLogoWithNameIconProps> = ({
  width = 144,
  height = 38,
  className,
}) => (
  <img
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNjAgOTYiPjxyZWN0IHdpZHRoPSIzNjAiIGhlaWdodD0iOTYiIHJ4PSIxNiIgZmlsbD0iIzEwMTgyNyIvPjx0ZXh0IHg9IjI0IiB5PSI2NCIgZmlsbD0iIzYyZjRiMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjU0IiBmb250LXdlaWdodD0iNzAwIj5CaXRjb2RlWDwvdGV4dD48L3N2Zz4="
    alt="BitcodeX"
    width={width}
    height={height}
    className={className}
  />
);
