export const BITCODEX_SDK_TARGET = "bitcodex_sdk";

export const BITCODEX_ATTACHED_POPUP = "bitcodex_attached_popup";

/**
 * BroadcastChannel name used for OAuth callback → attached iframe communication.
 * Fallback for Safari (iOS) where window.opener is null after cross-origin navigation.
 */
export const OAUTH_BROADCAST_CHANNEL = "bitcodex_oauth_callback";
