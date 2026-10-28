import { EventEmitter3 } from "./event";
import { lazyInit } from "./private/lazy_init";
import type {
  BitcodeXWalletCoreEvent2,
  BitcodeXWalletCoreEventHandler2,
  BitcodeXWalletStaticInterface,
  BitcodeXWalletWebInterface,
} from "./types";

export const BitcodeXWallet = function (
  this: BitcodeXWalletWebInterface,
  apiKey: string,
  iframe: HTMLIFrameElement,
  sdkEndpoint: string,
) {
  this.apiKey = apiKey;
  this.iframe = iframe;
  this.activePopupId = null;
  this.activePopupWindow = null;
  this._theme = null;
  this.sdkEndpoint = sdkEndpoint;
  this.origin = window.location.origin;
  this.eventEmitter = new EventEmitter3<
    BitcodeXWalletCoreEvent2,
    BitcodeXWalletCoreEventHandler2
  >();
  this.state = {
    authType: null,
    email: null,
    publicKey: null,
    name: null,
  };
  this.waitUntilInitialized = lazyInit(this).then();
} as unknown as BitcodeXWalletStaticInterface;
