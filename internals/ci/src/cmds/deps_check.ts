import { spawnSync } from "node:child_process";

import { expectSuccess } from "@bitcodex-ci/expect";
import { paths } from "@bitcodex-ci/paths";

export async function depsCheck(..._args: any[]) {
  console.log("Checking dependencies...");

  const publishRet = spawnSync(
    "yarn",
    ["syncpack", "lint", "--dependency-types", "prod,dev"],
    {
      cwd: paths.root,
      stdio: "inherit",
    },
  );

  expectSuccess(publishRet, "format failed");
}
