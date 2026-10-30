export const KEPLR_API_ENDPOINT = import.meta.env.VITE_KEPLR_API_ENDPOINT;

export const TX_INTERPRETER_API_ENDPOINT = import.meta.env
  .VITE_TX_INTERPRETER_API_ENDPOINT;

export const DEMO_WEB_ORIGIN = import.meta.env.VITE_DEMO_WEB_ORIGIN;

export const MOBILE_NATIVE_ORIGIN = import.meta.env.VITE_MOBILE_NATIVE_ORIGIN;

/**
 * Sites allowed to request Bittensor signatures (comma-separated origins). Requests from
 * any other origin are refused before the modal opens. Empty allows every origin.
 */
export const BITTENSOR_ALLOWED_HOST_ORIGINS: string[] = (
  import.meta.env.VITE_BITTENSOR_ALLOWED_HOST_ORIGINS ?? ""
)
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

/**
 * Check if the origin is a demo or sandbox context.
 * - Matches the configured DEMO_WEB_ORIGIN
 * - Treats non-http(s) origins (e.g. native app custom schemes like `myapp://`)
 *   as sandbox contexts where balance checks should be skipped.
 * - Mobile native with a valid apiKey is treated as sandbox
 *   (will be replaced with backend apiKey verification later).
 */
export function isDemoOrSandboxOrigin(
  hostOrigin: string,
  opts?: { isMobileNative?: boolean; apiKey?: string | null },
): boolean {
  if (opts?.isMobileNative && opts?.apiKey) {
    // TODO: verify apiKey against backend instead of unconditionally returning true
    return true;
  }

  if (hostOrigin === DEMO_WEB_ORIGIN) {
    return true;
  }
  if (
    hostOrigin !== "" &&
    !hostOrigin.startsWith("http://") &&
    !hostOrigin.startsWith("https://")
  ) {
    return true;
  }
  return false;
}

export const BITCODEX_API_ENDPOINT = import.meta.env.VITE_BITCODEX_API_ENDPOINT;

export const BITCODEX_PUBLIC_S3_BUCKET_URL = import.meta.env
  .VITE_PUBLIC_S3_BUCKET_URL;

export const USER_DASHBOARD_ORIGINS = import.meta.env
  .VITE_USER_DASHBOARD_ORIGINS;
