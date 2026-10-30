// Production build of the iframe, served by Vite preview (fast; no on-demand compiling).
// Env (VITE_*) is read from ~/.bitcodex/bitcodex_attached.env at build time.
loadEnv(ENV_FILE_NAME);

import { loadEnv, verifyEnv } from "@bitcodex/dotenv";
import { build, preview } from "vite";

import { ENV_FILE_NAME, envSchema } from "@bitcodex-attached/envs";

async function main() {
  const envRes = verifyEnv(envSchema, process.env);
  if (!envRes.success) {
    console.error("Env variable invalid\n%s", envRes.err);
    process.exit(1);
  }
  await build();
  const server = await preview({
    preview: { port: Number(process.env.SERVER_PORT), strictPort: true },
  });
  server.printUrls();
}

main().then();
