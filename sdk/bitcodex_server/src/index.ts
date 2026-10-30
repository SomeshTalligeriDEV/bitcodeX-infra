/**
 * @bitcodex/server: BitcodeX helpers for an app's backend (Node 22+).
 *
 * Available now (all verified on localnet, see the repo's bitcodex-docs/STATUS.md):
 * - Sign-In with Bittensor: `verifySiwb`, `parseSiwbMessage`, `caip2ChainId`
 * - network-checked chain access: `getApi` (refuses mainnet and unknown chains)
 * - app/agent permissions: `actAs` (proxy.proxy signed by your agent key, fails on a
 *   failed inner call), `getProxies`, `getProxyFilter(s)`, `describePermission`
 * - read-only wallet data: `getBalances`, `getStakes`, `getHotkeyInfo`, `listSubnets`
 *
 * - access tokens: `verifyAccessToken` (EdDSA JWT, keys from the API's JWKS)
 * - server API: `createServerClient({ apiUrl, appId, appSecret })` → getUser, getWallets
 */
export {
  type ActAsResult,
  actAs,
  type BittensorChainId,
  caip2ChainId,
  checkNetwork,
  describePermission,
  disconnectAll,
  formatTaoAmount,
  getApi,
  getBalances,
  getHotkeyInfo,
  getProxies,
  getProxyFilter,
  getProxyFilters,
  getStakes,
  listSubnets,
  NETWORKS,
  parseSiwbMessage,
  parseUnits,
  type SiwbFields,
  type VerifiedSiwb,
  type VerifySiwbExpect,
  verifySiwb,
} from "@bitcodex/bittensor-chain";

export {
  type AccessTokenError,
  type VerifiedAccessToken,
  type VerifyAccessTokenOptions,
  verifyAccessToken,
} from "./access_token";
export {
  BitcodeXApiError,
  type BitcodeXUser,
  type BitcodeXWallet,
  createServerClient,
  type ServerClientOptions,
} from "./client";
