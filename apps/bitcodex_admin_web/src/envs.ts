import { z } from "zod";

export const ENV_FILE_NAME = "bitcodex_admin_web.env";
export const EXAMPLE_ENV_FILE = "bitcodex_admin_web.env.example";

export const envSchema = z.object({
  SERVER_PORT: z.string(),
  NEXT_PUBLIC_BITCODEX_API_ENDPOINT: z.string(),
});
