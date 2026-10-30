import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {},
  transpilePackages: ["@bitcodex/bitcodex-sdk-react"],
  // Server routes (demo agent) load these unbundled: Next's SWC folds @scure/sr25519's
  // `proving${"\\0"}0` into the invalid template `proving\\00` when bundling (2026-10-29).
  serverExternalPackages: [
    "@scure/sr25519",
    "@polkadot/util-crypto",
    "@polkadot/keyring",
    "@polkadot/api",
    "@bitcodex/bittensor-chain",
  ],
};

export default nextConfig;
