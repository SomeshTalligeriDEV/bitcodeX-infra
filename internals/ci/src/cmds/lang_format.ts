import { spawnSync } from "node:child_process";

import { expectSuccess } from "@bitcodex-ci/expect";
import { paths } from "@bitcodex-ci/paths";

export async function langFormat(_args: string[]) {
  console.log("Formatting codebase...");

  const publishRet = spawnSync("yarn", ["exec", "biome", "format", "--write"], {
    cwd: paths.root,
    stdio: "inherit",
  });

  expectSuccess(publishRet, "format failed");
}
