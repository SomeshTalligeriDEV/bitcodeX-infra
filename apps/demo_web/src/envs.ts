import { z } from "zod";

export const ENV_FILE_NAME = "demo_web.env";
export const EXAMPLE_ENV_FILE = "demo_web.env.example";

export const envSchema = z.object({
  SERVER_PORT: z.string(),
  // "true" once a GitHub OAuth app is configured (shows the GitHub button).
  NEXT_PUBLIC_GITHUB_ENABLED: z.string().optional(),
  // bittensor:localnet (default) or bittensor:testnet; mainnet is refused.
  NEXT_PUBLIC_BITTENSOR_CHAIN_ID: z
    .enum(["bittensor:localnet", "bittensor:testnet"])
    .optional(),
  NEXT_PUBLIC_BITCODEX_SDK_ENDPOINT: z.string(),
  // The app's public API key from the BitcodeX dashboard or the bootstrap script.
  NEXT_PUBLIC_BITCODEX_API_KEY: z.string().optional(),
  NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_S3_BUCKET_URL: z.string().optional(),
  // BitcodeX API, used for the localnet test-TAO faucet. Unset hides "Get test TAO".
  NEXT_PUBLIC_BITCODEX_API_ENDPOINT: z.string().optional(),
});
