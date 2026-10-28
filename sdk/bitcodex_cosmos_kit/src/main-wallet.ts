import { BitcodeXCosmosWallet } from "@bitcodex/bitcodex-sdk-cosmos";
import {
  type ChainName,
  type DisconnectOptions,
  MainWalletBase,
  State,
} from "@cosmos-kit/core";

import { BitcodeXChainWallet } from "./chain-wallet";
import { BitcodeXWalletClient } from "./client";
import type { BitcodeXWalletInfo } from "./types";

export class BitcodeXMainWallet extends MainWalletBase {
  constructor(walletInfo: BitcodeXWalletInfo) {
    super(walletInfo, BitcodeXChainWallet);
  }

  get walletInfo(): BitcodeXWalletInfo {
    return this._walletInfo as BitcodeXWalletInfo;
  }

  async initClient() {
    const { options } = this.walletInfo;

    try {
      if (!options) {
        throw new Error("BitcodeX wallet options unset");
      }

      if (!options.apiKey) {
        throw new Error("BitcodeX API key is required");
      }
    } catch (error) {
      this.initClientError(error as Error);
      return;
    }

    this.initingClient();
    try {
      const cosmosWallet = BitcodeXCosmosWallet.init({
        api_key: options.apiKey,
        sdk_endpoint: options.sdkEndpoint,
      });

      if (!cosmosWallet.success) {
        throw new Error("Failed to initialize BitcodeXCosmosWallet");
      }

      this.initClientDone(new BitcodeXWalletClient(cosmosWallet.data));
    } catch (error) {
      this.initClientError(error as Error);
    }
  }

  async disconnectAll(
    activeOnly?: boolean,
    exclude?: ChainName,
    options?: DisconnectOptions,
  ): Promise<void> {
    if (this.client) {
      const bitcodexClient = this.client as BitcodeXWalletClient;
      await bitcodexClient.client.bitcodexWallet.signOut();
    }

    await super.disconnectAll(activeOnly, exclude, options);

    // Reset client state to Init to force re-initialization on next connect
    this.clientMutable.data = undefined;
    this.clientMutable.state = State.Init;
  }
}
