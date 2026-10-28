import { type ConfigPlugin, createRunOncePlugin } from "@expo/config-plugins";

import { withBitcodeXAuthBrowserAndroid } from "./withBitcodeXAuthBrowserAndroid";

const DEFAULT_CALLBACK_SCHEME = "bitcodex.auth.callback";

/**
 * Expo config plugin for BitcodeXAuthBrowser Android activities.
 *
 * @param callbackScheme - Custom scheme registered on BitcodeXAuthCallbackActivity's
 *   intent-filter (default: "bitcodex.auth.callback"). If you override this, you MUST
 *   also pass the same value as `androidCallbackScheme` to `BitcodeXWalletRNConfig` /
 *   `BitcodeXWalletProvider` so the runtime and manifest agree. Mismatched values will
 *   cause the CustomTabs fallback path to fail (the SDK logs a warning at runtime).
 */
const withBitcodeXAuthBrowser: ConfigPlugin<
  { callbackScheme?: string } | undefined
> = (config, props) => {
  const callbackScheme = props?.callbackScheme ?? DEFAULT_CALLBACK_SCHEME;
  config = withBitcodeXAuthBrowserAndroid(config, { callbackScheme });
  return config;
};

export default createRunOncePlugin(
  withBitcodeXAuthBrowser,
  "@bitcodex/bitcodex-sdk-core-react-native",
);
