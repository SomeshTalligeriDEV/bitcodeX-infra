import type { BitcodeXWalletWebInterface } from "./types";

declare global {
  interface Window {
    __bitcodex: BitcodeXWalletWebInterface | null | undefined;
    __bitcodex_locked: boolean;
    __bitcodex_ev: ((ev: MessageEvent) => void) | null | undefined;
  }
}
