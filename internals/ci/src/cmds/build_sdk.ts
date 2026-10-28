import { buildInStages } from "@bitcodex-ci/build";
import { paths } from "@bitcodex-ci/paths";

export async function buildSDK(..._args: any[]) {
  await doBuildSDK();
}

export async function doBuildSDK() {
  const stages = [
    [paths.sdk_core, paths.bittensor_chain],
    [
      paths.sdk_cosmos,
      paths.sdk_eth,
      paths.sdk_svm,
      paths.sdk_bittensor,
      paths.sdk_core_react_native,
    ],
    [paths.sdk_react],
  ];

  await buildInStages(stages, 4);
}
