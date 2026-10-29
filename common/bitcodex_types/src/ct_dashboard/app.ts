export type AppLoginMethod =
  | "google"
  | "github"
  | "x"
  | "telegram"
  | "discord"
  | "wallet";

export const APP_LOGIN_METHODS: readonly AppLoginMethod[] = [
  "google",
  "github",
  "x",
  "telegram",
  "discord",
  "wallet",
];

export type AppNetwork = "bittensor:localnet" | "bittensor:testnet";

export interface App {
  app_id: string;
  customer_id: string;
  label: string;
  allowed_origins: string[];
  login_methods: AppLoginMethod[];
  accent_color: string | null;
  theme_mode: "light" | "dark" | "system";
  logo_url: string | null;
  network: AppNetwork;
  /** sha256 hex of the app secret; never sent to clients. */
  secret_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

/** What the iframe and SDK may see (no secret hash, no customer id). */
export interface PublicAppConfig {
  app_id: string;
  label: string;
  allowed_origins: string[];
  login_methods: AppLoginMethod[];
  accent_color: string | null;
  theme_mode: "light" | "dark" | "system";
  logo_url: string | null;
  network: AppNetwork;
}
