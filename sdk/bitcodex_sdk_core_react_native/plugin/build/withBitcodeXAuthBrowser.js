"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withBitcodeXAuthBrowserAndroid_1 = require("./withBitcodeXAuthBrowserAndroid");
const DEFAULT_CALLBACK_SCHEME = "bitcodex.auth.callback";
const withBitcodeXAuthBrowser = (config, props) => {
  const callbackScheme = props?.callbackScheme ?? DEFAULT_CALLBACK_SCHEME;
  config = (0, withBitcodeXAuthBrowserAndroid_1.withBitcodeXAuthBrowserAndroid)(config, {
    callbackScheme,
  });
  return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(
  withBitcodeXAuthBrowser,
  "@bitcodex/bitcodex-sdk-core-react-native",
);
