import { z } from "zod";

import { registry } from "../registry";

const LOGIN_METHODS = [
  "google",
  "github",
  "x",
  "telegram",
  "discord",
  "wallet",
] as const;

/** Exact origin: scheme://host[:port], no path, query or trailing slash. */
export const OriginSchema = z
  .string()
  .max(255)
  .refine((v) => {
    try {
      const u = new URL(v);
      return (
        (u.protocol === "http:" || u.protocol === "https:") && u.origin === v
      );
    } catch {
      return false;
    }
  }, "must be an exact origin like https://app.example.com or http://localhost:3200")
  .openapi({ example: "http://localhost:3200" });

export const AppSettingsSchema = z.object({
  label: z.string().min(1).max(128).optional(),
  allowed_origins: z.array(OriginSchema).max(20).optional().openapi({
    description:
      "Sites allowed to use this app's key. Empty list = any origin.",
  }),
  login_methods: z
    .array(z.enum(LOGIN_METHODS))
    .min(1)
    .max(LOGIN_METHODS.length)
    .refine((v) => new Set(v).size === v.length, "no duplicates")
    .optional()
    .openapi({ description: "Enabled login methods, in display order." }),
  accent_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable()
    .optional(),
  theme_mode: z.enum(["light", "dark", "system"]).optional(),
  logo_url: z
    .string()
    .url()
    .max(1024)
    .regex(/^https?:\/\//)
    .nullable()
    .optional(),
  network: z.enum(["bittensor:localnet", "bittensor:testnet"]).optional(),
});

export const CreateAppRequestSchema = registry.register(
  "CreateAppRequest",
  z.object({
    label: z.string().min(1).max(128),
    allowed_origins: z.array(OriginSchema).max(20).optional(),
  }),
);

export const UpdateAppRequestSchema = registry.register(
  "UpdateAppRequest",
  AppSettingsSchema.extend({ app_id: z.string().uuid() }),
);

export const AppIdRequestSchema = registry.register(
  "AppIdRequest",
  z.object({ app_id: z.string().uuid() }),
);

const AppSchema = z.object({
  app_id: z.string(),
  label: z.string(),
  allowed_origins: z.array(z.string()),
  login_methods: z.array(z.string()),
  accent_color: z.string().nullable(),
  theme_mode: z.string(),
  logo_url: z.string().nullable(),
  network: z.string(),
  has_secret: z.boolean(),
  api_keys: z.array(
    z.object({
      key_id: z.string(),
      api_key: z.string(),
      is_active: z.boolean(),
    }),
  ),
  created_at: z.string(),
});

export const AppListSuccessResponseSchema = registry.register(
  "AppListSuccessResponse",
  z.object({ success: z.literal(true), data: z.array(AppSchema) }),
);

export const AppSuccessResponseSchema = registry.register(
  "AppSuccessResponse",
  z.object({ success: z.literal(true), data: AppSchema }),
);

export const AppCreatedSuccessResponseSchema = registry.register(
  "AppCreatedSuccessResponse",
  z.object({
    success: z.literal(true),
    data: z.object({
      app: AppSchema,
      api_key: z
        .string()
        .openapi({ description: "Public client key (x-api-key)." }),
      app_secret: z.string().openapi({
        description: "Server secret. Shown ONCE; only its sha256 is stored.",
      }),
    }),
  }),
);

export const AppSecretSuccessResponseSchema = registry.register(
  "AppSecretSuccessResponse",
  z.object({
    success: z.literal(true),
    data: z.object({ app_id: z.string(), app_secret: z.string() }),
  }),
);

export const AppUsersSuccessResponseSchema = registry.register(
  "AppUsersSuccessResponse",
  z.object({
    success: z.literal(true),
    data: z.array(
      z.object({
        user_id: z.string(),
        email: z.string().nullable(),
        auth_type: z.string().nullable(),
        address: z.string().nullable(),
        connected_at: z.string(),
        last_seen_at: z.string(),
      }),
    ),
  }),
);

export const PublicAppConfigSuccessResponseSchema = registry.register(
  "PublicAppConfigSuccessResponse",
  z.object({
    success: z.literal(true),
    data: z.object({
      app_id: z.string(),
      label: z.string(),
      allowed_origins: z.array(z.string()),
      login_methods: z.array(z.string()),
      accent_color: z.string().nullable(),
      theme_mode: z.string(),
      logo_url: z.string().nullable(),
      network: z.string(),
    }),
  }),
);
