import * as wasmModule from "@bitcodex/frost-ed25519-cosmos-compat-wasm/pkg/frost_ed25519_cosmos_compat_wasm";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const wasmInitState = {
  initialized: false,
};

export async function initWasmForTest(): Promise<void> {
  if (wasmInitState.initialized) {
    return;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const wasmPath = join(
    __dirname,
    "../../../frost_ed25519_cosmos_compat_wasm/pkg/frost_ed25519_cosmos_compat_wasm_bg.wasm",
  );
  const wasmBytes = readFileSync(wasmPath);

  (wasmModule as any).initSync({ module: wasmBytes });
  wasmInitState.initialized = true;
}

export { wasmModule };
