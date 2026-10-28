import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const paths = (function () {
  const root = path.join(__dirname, "../../../");

  const github = path.join(root, "internals/github");

  const ksn_interface = path.join(
    __dirname,
    "../../../key_share_node/ksn_interface/",
  );

  const ksn_server = path.join(__dirname, "../../../key_share_node/server");

  const ksn_pg_interface = path.join(
    __dirname,
    "../../../key_share_node/pg_interface/",
  );

  const dotenv = path.join(__dirname, "../../../lib/dotenv");

  const stdlib = path.join(__dirname, "../../../lib/stdlib_js");

  const bitcodex_types = path.join(
    __dirname,
    "../../../common/bitcodex_types/",
  );

  const sdk_core = path.join(__dirname, "../../../sdk/bitcodex_sdk_core/");

  const sdk_react = path.join(__dirname, "../../../sdk/bitcodex_sdk_react/");

  const sdk_core_react_native = path.join(
    __dirname,
    "../../../sdk/bitcodex_sdk_core_react_native/",
  );

  const sdk_svm = path.join(__dirname, "../../../sdk/bitcodex_sdk_svm/");

  const sdk_eth = path.join(__dirname, "../../../sdk/bitcodex_sdk_eth/");

  const sdk_cosmos = path.join(__dirname, "../../../sdk/bitcodex_sdk_cosmos/");

  const sandbox_simple_host = path.join(
    __dirname,
    "../../../sandbox/bitcodex_sandbox_simple_host/",
  );

  const sandbox_sol = path.join(
    __dirname,
    "../../../sandbox/bitcodex_sandbox_sol/",
  );

  const crypto_bytes = path.join(__dirname, "../../../crypto/bytes/");

  const crypto_js = path.join(__dirname, "../../../crypto/crypto_js/");

  const tecdsa_interface = path.join(
    __dirname,
    "../../../crypto/tecdsa/tecdsa_interface/",
  );

  const teddsa_interface = path.join(
    __dirname,
    "../../../crypto/teddsa/teddsa_interface/",
  );

  // internals2
  const cait_sith_addon_addon = path.join(
    __dirname,
    "../../../crypto/tecdsa/cait_sith_cosmos_compat_addon/addon",
  );

  const cait_sith_cosmos_compat_wasm = path.join(
    __dirname,
    "../../../crypto/tecdsa/cait_sith_cosmos_compat_wasm",
  );

  const frost_cosmos_compat_wasm = path.join(
    __dirname,
    "../../../crypto/teddsa/frost_ed25519_cosmos_compat_wasm",
  );

  const teddsa_addon_addon = path.join(
    __dirname,
    "../../../crypto/teddsa/teddsa_addon/addon",
  );

  const bitcodex_pg_interface = path.join(
    __dirname,
    "../../../backend/bitcodex_pg_interface",
  );

  const attached_mobile_host_web = path.join(
    __dirname,
    "../../../apps/attached_mobile_host_web",
  );

  const bitcodex_attached = path.join(
    __dirname,
    "../../../embed/bitcodex_attached",
  );

  const bitcodex_admin_web = path.join(
    __dirname,
    "../../../apps/bitcodex_admin_web/",
  );

  const demo_web = path.join(__dirname, "../../../apps/demo_web");

  const user_dashboard = path.join(__dirname, "../../../apps/user_dashboard/");

  const ct_dashboard_web = path.join(
    __dirname,
    "../../../apps/customer_dashboard",
  );

  const bitcodex_api_server = path.join(
    __dirname,
    "../../../backend/bitcodex_api/server",
  );

  const admin_api = path.join(__dirname, "../../../backend/admin_api");

  const ct_dashboard_api = path.join(
    __dirname,
    "../../../backend/ct_dashboard_api",
  );

  const dockerfiles = path.join(__dirname, "../../docker");

  const dockerfiles_bitcodex = path.join(__dirname, "../../docker/bitcodex");

  const example_evm_nextjs = path.join(
    __dirname,
    "../../../examples/evm_nextjs",
  );

  const example_evm_wagmi_nextjs = path.join(
    __dirname,
    "../../../examples/evm_wagmi_nextjs",
  );

  const example_multi_ecosystem_react = path.join(
    __dirname,
    "../../../examples/multi_ecosystem_react",
  );

  const example_svm_nextjs = path.join(
    __dirname,
    "../../../examples/svm_nextjs",
  );

  return {
    root,
    github,
    stdlib,
    dotenv,
    example_evm_nextjs,
    example_evm_wagmi_nextjs,
    example_multi_ecosystem_react,
    example_svm_nextjs,
    bitcodex_types,
    sdk_core,
    sdk_core_react_native,
    sdk_eth,
    sdk_cosmos,
    sdk_react,
    sdk_svm,
    crypto_bytes,
    crypto_js,
    ksn_interface,
    ksn_server,
    ksn_pg_interface,
    sandbox_simple_host,
    sandbox_sol,
    tecdsa_interface,
    teddsa_interface,
    bitcodex_pg_interface,
    bitcodex_attached,
    bitcodex_admin_web,
    cait_sith_cosmos_compat_wasm,
    cait_sith_addon_addon,
    frost_cosmos_compat_wasm,
    teddsa_addon_addon,
    demo_web,
    user_dashboard,
    ct_dashboard_web,
    bitcodex_api_server,
    admin_api,
    ct_dashboard_api,
    attached_mobile_host_web,
    dockerfiles,
    dockerfiles_bitcodex,
  };
})();
