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
 * Not built yet (X10): access-token verification (JWKS), getUser, getWallets.
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
