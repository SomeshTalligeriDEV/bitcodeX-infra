import { spawnSync } from "node:child_process";

import { expectSuccess } from "@bitcodex-ci/expect";
import { paths } from "@bitcodex-ci/paths";

export async function langLint(args: string[]) {
  console.log("Start lang lint, args: %s", args);

  const ret = spawnSync(
    "yarn",
    ["exec", "biome", "check", "--write", ...args],
    {
      cwd: paths.root,
      stdio: "inherit",
    },
  );

  expectSuccess(ret, "format failed");
}
