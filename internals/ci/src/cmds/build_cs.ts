import { spawnSync } from "node:child_process";
import chalk from "chalk";

import { expectSuccess } from "@bitcodex-ci/expect";
import { paths } from "@bitcodex-ci/paths";

export async function buildCs(..._args: any[]) {
  console.log("Building Cait Sith...");

  const addonRet = spawnSync("yarn", ["run", "build"], {
    cwd: paths.cait_sith_addon_addon,
    stdio: "inherit",
  });
  expectSuccess(addonRet, "addon build failed");
  console.log("%s %s", chalk.bold.green("Done"), "cait sith addon");

  const caitSithWasmRet = spawnSync("yarn", ["run", "build:wasm"], {
    cwd: paths.cait_sith_cosmos_compat_wasm,
    stdio: "inherit",
  });
  expectSuccess(caitSithWasmRet, "wasm build failed");
  console.log("%s %s", chalk.bold.green("Done"), "build wasm cait sith");

  const copyRet = spawnSync("yarn", ["run", "copy_wasm_cs"], {
    cwd: paths.bitcodex_attached,
    stdio: "inherit",
  });
  expectSuccess(copyRet, "copy cait sith wasm failed");
  console.log("%s %s", chalk.bold.green("Done"), "copy wasm cait sith");
}
