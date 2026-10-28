import type { Wallet } from "@cosmos-kit/core";

import { BITCODEX_ICON } from "./constant";

export const bitcodexWalletInfo: Wallet = {
  name: "bitcodex-wallet",
  prettyName: "BitcodeX Wallet",
  logo: BITCODEX_ICON,
  mode: "extension",
  mobileDisabled: false,
  rejectMessage: {
    source: "Request rejected",
  },
};
