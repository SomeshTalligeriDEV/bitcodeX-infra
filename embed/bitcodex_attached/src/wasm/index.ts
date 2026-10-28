import { initWasm as initCaitSithWasm } from "@bitcodex/cait-sith-cosmos-compat-wasm";
import * as caitSithWasmModule from "@bitcodex/cait-sith-cosmos-compat-wasm/pkg/cait_sith_cosmos_compat_wasm";
import { initWasm as initFrostWasm } from "@bitcodex/frost-ed25519-cosmos-compat-wasm";
import * as frostWasmModule from "@bitcodex/frost-ed25519-cosmos-compat-wasm/pkg/frost_ed25519_cosmos_compat_wasm";

export async function initKeplrWasm() {
  await initCaitSithWasm(
    caitSithWasmModule,
    "/pkg/cait_sith_cosmos_compat_wasm_bg.wasm",
  );
  console.log("[attached] cait-sith WASM initialized");

  await initFrostWasm(
    frostWasmModule,
    "/pkg/frost_ed25519_cosmos_compat_wasm_bg.wasm",
  );
  console.log("[attached] frost-ed25519 WASM initialized");
}
