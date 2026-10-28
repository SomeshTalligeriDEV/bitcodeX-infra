import { injectExtension } from "@polkadot/extension-inject";
import type {
  Injected,
  InjectedAccount,
} from "@polkadot/extension-inject/types";

import type { BitcodeXBittensorWallet } from "./bittensor_wallet";

export const INJECTED_NAME = "bitcodex";

export interface InjectWeb3Options {
  /** Key in window.injectedWeb3 (default "bitcodex"). */
  name?: string;
  version?: string;
  /** Account label shown by dApps. */
  accountName?: string;
}

/**
 * Register BitcodeX in `window.injectedWeb3`, so apps using
 * `@polkadot/extension-dapp` (`web3Enable`, `web3Accounts`, `web3FromSource`) see it
 * like an installed extension. Signing still goes through the BitcodeX modal.
 */
export function injectWeb3(
  wallet: BitcodeXBittensorWallet,
  options: InjectWeb3Options = {},
): void {
  const name = options.name ?? INJECTED_NAME;
  const accountName = options.accountName ?? "BitcodeX";

  const toAccounts = (address: string | null): InjectedAccount[] =>
    address ? [{ address, name: accountName, type: "ed25519" }] : [];

  async function enable(_originName: string): Promise<Injected> {
    await wallet.connect();
    return {
      accounts: {
        get: async () => toAccounts(await wallet.getAddress()),
        subscribe: (cb: (accounts: InjectedAccount[]) => unknown) => {
          const handler = (address: string | null) => {
            cb(toAccounts(address));
          };
          wallet.on("accountChanged", handler);
          cb(toAccounts(wallet.address));
          return () => wallet.off("accountChanged", handler);
        },
      },
      signer: wallet.signer,
    };
  }

  injectExtension(enable, { name, version: options.version ?? "0.1.0" });
}
