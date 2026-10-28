"use client";

import type { FC, PropsWithChildren } from "react";

import { Skeleton } from "@/components/skeleton/skeleton";
import { ToggleColorScheme } from "@/components/toggle_color_scheme/toggle_color_scheme";
import { useInitBitcodeX } from "./use_init_bitcodex";

export const BitcodeXProvider: FC<PropsWithChildren> = ({ children }) => {
  const { isInitialized } = useInitBitcodeX();

  return (
    <div>
      <p>isInitialized {isInitialized ? "true" : "false"}</p>

      <p>Animation check</p>

      <ToggleColorScheme />

      <Skeleton width="100px" height="100px" borderRadius="20px" />

      {isInitialized && <>{children}</>}
    </div>
  );
};
