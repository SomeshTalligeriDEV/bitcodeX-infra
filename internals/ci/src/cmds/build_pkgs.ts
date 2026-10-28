import { buildInStages } from "@bitcodex-ci/build";
import { paths } from "@bitcodex-ci/paths";

export async function buildPkgs(..._args: any[]) {
  await doBuildPkgs();
}

export async function doBuildPkgs() {
  const stages = [
    [paths.stdlib, paths.tecdsa_interface, paths.github],
    [paths.dotenv, paths.crypto_bytes],
    [paths.crypto_js, paths.bitcodex_types],
    [paths.teddsa_interface, paths.ksn_interface],
  ];

  await buildInStages(stages, 4);
}
