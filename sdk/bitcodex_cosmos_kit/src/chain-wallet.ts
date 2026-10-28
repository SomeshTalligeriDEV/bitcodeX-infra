import { ChainWalletBase, State } from "@cosmos-kit/core";

import type { BitcodeXMainWallet } from "./main-wallet";

export class BitcodeXChainWallet extends ChainWalletBase {
  async update() {
    // If MainWallet's client is undefined and state is Init, force re-initialization
    const mainWallet = this.mainWallet as BitcodeXMainWallet;
    if (
      mainWallet &&
      !mainWallet.client &&
      mainWallet.clientMutable?.state === State.Init
    ) {
      await mainWallet.initClient();
    }

    await super.update();
  }
}
