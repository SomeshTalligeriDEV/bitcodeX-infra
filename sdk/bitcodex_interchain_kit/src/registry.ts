import type { Wallet } from "@interchain-kit/core";

import { BITCODEX_ICON } from "./constant";

export const bitcodexWalletInfo: Wallet = {
  name: "bitcodex-wallet",
  prettyName: "BitcodeX Wallet",
  logo: BITCODEX_ICON,
  keystoreChange: "accountsChanged",
} as Wallet;
