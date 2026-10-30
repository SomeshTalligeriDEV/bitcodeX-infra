// `next build` with the demo's env (NEXT_PUBLIC_* are inlined at build time).
// Webpack, not Turbopack: Turbopack's minifier turns polkadot.js's "proving\\0" into an
// invalid template string (octal escape), breaking the server bundle (2026-10-29).
loadEnv(ENV_FILE_NAME);

import { spawnSync } from "node:child_process";
import { loadEnv } from "@bitcodex/dotenv";

import { ENV_FILE_NAME } from "@bitcodex-demo-web/envs";

const res = spawnSync("npx", ["next", "build", "--webpack"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(res.status ?? 1);
