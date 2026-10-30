import { CUSTOMER_V1_ENDPOINT } from "./customers";
import { errorHandle } from "./utils";

export interface AppView {
  app_id: string;
  label: string;
  allowed_origins: string[];
  login_methods: string[];
  accent_color: string | null;
  theme_mode: "light" | "dark" | "system";
  logo_url: string | null;
  network: string;
  has_secret: boolean;
  api_keys: { key_id: string; api_key: string; is_active: boolean }[];
  created_at: string;
}

export interface AppUser {
  user_id: string;
  email: string | null;
  auth_type: string | null;
  address: string | null;
  connected_at: string;
  last_seen_at: string;
}

const call = <T>(token: string, path: string, body: unknown = {}) =>
  errorHandle<T>(() =>
    fetch(`${CUSTOMER_V1_ENDPOINT}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    }),
  );

export const requestListApps = (token: string) =>
  call<AppView[]>(token, "/apps/list");

export const requestCreateApp = (
  token: string,
  label: string,
  allowed_origins: string[],
) =>
  call<{ app: AppView; api_key: string; app_secret: string }>(
    token,
    "/apps/create",
    { label, allowed_origins },
  );

export const requestUpdateApp = (
  token: string,
  app_id: string,
  update: Partial<
    Pick<
      AppView,
      | "label"
      | "allowed_origins"
      | "login_methods"
      | "accent_color"
      | "theme_mode"
      | "logo_url"
      | "network"
    >
  >,
) => call<AppView>(token, "/apps/update", { app_id, ...update });

export const requestRotateSecret = (token: string, app_id: string) =>
  call<{ app_id: string; app_secret: string }>(token, "/apps/rotate_secret", {
    app_id,
  });

export const requestAppUsers = (token: string, app_id: string) =>
  call<AppUser[]>(token, "/apps/users", { app_id });
