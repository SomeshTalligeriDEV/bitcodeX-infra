import { useBitcodeX } from "@bitcodex/bitcodex-sdk-react";
import { useEffect } from "react";

import { useThemeState } from "@bitcodex-demo-web/state/theme";

export const useThemeSync = () => {
  const { initialize, setTheme } = useThemeState();
  const theme = useThemeState((s) => s.theme);
  const preference = useThemeState((s) => s.preference);
  const { isReady, setTheme: setBitcodeXTheme } = useBitcodeX();

  useEffect(() => {
    if (useThemeState.persist.hasHydrated()) {
      initialize();
      return;
    }
    return useThemeState.persist.onFinishHydration(() => {
      initialize();
    });
  }, [initialize]);

  useEffect(() => {
    if (preference !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference, setTheme]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    setBitcodeXTheme(theme);
  }, [theme, isReady, setBitcodeXTheme]);
};
