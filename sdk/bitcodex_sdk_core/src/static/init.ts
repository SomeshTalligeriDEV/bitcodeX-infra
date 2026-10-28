import { UTM_CAMPAIGN, UTM_SOURCE } from "@bitcodex/bitcodex-types/referral";
import type { Result } from "@bitcodex/stdlib-js";

import { BitcodeXWallet } from "@bitcodex-sdk-core/constructor";
import type { BitcodeXWalletInitError } from "@bitcodex-sdk-core/errors";
import { setUpIframeElement } from "@bitcodex-sdk-core/iframe";
import type {
  BitcodeXWalletInitArgs,
  BitcodeXWalletWebInterface,
} from "@bitcodex-sdk-core/types";

const SDK_ENDPOINT = `http://localhost:3201`;

export function init(
  args: BitcodeXWalletInitArgs,
): Result<BitcodeXWalletWebInterface, BitcodeXWalletInitError> {
  try {
    console.log("[bitcodex] init");

    if (window === undefined) {
      console.error(
        "[bitcodex] bitcodex wallet can only be initialized in the browser",
      );

      return {
        success: false,
        err: { type: "not_in_browser" },
      };
    }

    if (window.__bitcodex_locked === true) {
      console.warn(
        "bitcodex wallet init is locked. Is init being executed concurrently?",
      );
      return { success: false, err: { type: "is_locked" } };
    } else {
      window.__bitcodex_locked = true;
    }

    console.log("[bitcodex] sdk endpoint: %s", args.sdk_endpoint);

    if (window.__bitcodex) {
      console.warn("[bitcodex] already initialized");

      if (args.theme) {
        window.__bitcodex.setTheme(args.theme);
      }

      return { success: true, data: window.__bitcodex };
    }

    const hostOrigin = new URL(window.location.toString()).origin;
    if (hostOrigin.length === 0) {
      return {
        success: false,
        err: { type: "host_origin_empty" },
      };
    }

    const sdkEndpoint = args.sdk_endpoint ?? SDK_ENDPOINT;

    // Check if endpoint is valid url format
    let sdkEndpointURL: URL;
    try {
      sdkEndpointURL = new URL(sdkEndpoint);
      sdkEndpointURL.searchParams.append("host_origin", hostOrigin);

      // Forward UTM parameters to attached iframe for referral tracking
      const currentUrl = new URL(window.location.toString());
      const utmSource = currentUrl.searchParams.get(UTM_SOURCE);
      const utmCampaign = currentUrl.searchParams.get(UTM_CAMPAIGN);

      if (utmSource) {
        sdkEndpointURL.searchParams.append(UTM_SOURCE, utmSource);
      }
      if (utmCampaign) {
        sdkEndpointURL.searchParams.append(UTM_CAMPAIGN, utmCampaign);
      }

      sdkEndpointURL.searchParams.append("sdk_version", BitcodeXWallet.version);

      if (args.theme) {
        sdkEndpointURL.searchParams.append("theme", args.theme);
      }
    } catch (_err) {
      return {
        success: false,
        err: { type: "sdk_endpoint_invalid_url" },
      };
    }

    console.log("[bitcodex] resolved sdk endpoint: %s", sdkEndpoint);
    console.log("[bitcodex] host origin: %s", hostOrigin);

    const iframeRes = setUpIframeElement(sdkEndpointURL);
    if (!iframeRes.success) {
      return {
        success: false,
        err: { type: "iframe_setup_fail", msg: iframeRes.err.toString() },
      };
    }

    const iframe = iframeRes.data;

    const bitcodexWallet = new BitcodeXWallet(
      args.api_key,
      iframe,
      sdkEndpoint,
    );
    bitcodexWallet._theme = args.theme ?? null;

    if (window.__bitcodex) {
      console.warn(
        "[bitcodex] bitcodex wallet has been initialized by another process",
      );

      return { success: true, data: window.__bitcodex };
    } else {
      window.__bitcodex = bitcodexWallet;
      return { success: true, data: bitcodexWallet };
    }
  } catch (err: any) {
    console.error("[bitcodex] init fail", err);

    throw new Error("[bitcodex] sdk init fail, unreachable");
  } finally {
    if (window.__bitcodex_locked === true) {
      window.__bitcodex_locked = false;
    }
  }
}
