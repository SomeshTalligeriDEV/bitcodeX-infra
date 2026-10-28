import { z } from "zod";

export const ENV_FILE_NAME = "customer_dashboard.env";
export const EXAMPLE_ENV_FILE = "customer_dashboard.env.example";

export const envSchema = z.object({
  SERVER_PORT: z.string(),
  NEXT_PUBLIC_BITCODEX_API_ENDPOINT: z.string(),
  NEXT_PUBLIC_BITCODEX_DEMO_ENDPOINT: z.string(),
  NEXT_PUBLIC_BITCODEX_DOCS_ENDPOINT: z.string(),
  NEXT_PUBLIC_BITCODEX_FEATURE_REQUEST_ENDPOINT: z.string(),
  NEXT_PUBLIC_BITCODEX_GET_SUPPORT_ENDPOINT: z.string(),
});
