import { createContext } from "react";

import { initialCoreState } from "./reducer";
import type { BitcodeXCoreAction, BitcodeXCoreState } from "./types";

export interface BitcodeXContextValue {
  state: BitcodeXCoreState;
  dispatch: React.Dispatch<BitcodeXCoreAction>;
}

export const BitcodeXContext = createContext<BitcodeXContextValue>({
  state: initialCoreState,
  dispatch: () => {
    throw new Error(
      "[bitcodex-react] useBitcodeX must be used within <BitcodeXProvider>",
    );
  },
});
