import type {
  App,
  PublicAppConfig,
} from "@bitcodex/bitcodex-types/ct_dashboard";
import type { Result } from "@bitcodex/stdlib-js";
import type { Pool, PoolClient } from "pg";

type Db = Pool | PoolClient;

export function toPublicAppConfig(app: App): PublicAppConfig {
  return {
    app_id: app.app_id,
    label: app.label,
    allowed_origins: app.allowed_origins,
    login_methods: app.login_methods,
    accent_color: app.accent_color,
    theme_mode: app.theme_mode,
    logo_url: app.logo_url,
    network: app.network,
  };
}

async function one<T>(
  db: Db,
  query: string,
  args: unknown[],
): Promise<Result<T | null, string>> {
  try {
    const res = await db.query(query, args);
    return { success: true, data: (res.rows[0] as T) ?? null };
  } catch (error) {
    return { success: false, err: String(error) };
  }
}

export async function getAppsByCustomerId(
  db: Db,
  customerId: string,
): Promise<Result<App[], string>> {
  try {
    const res = await db.query(
      "SELECT * FROM apps WHERE customer_id = $1 ORDER BY created_at",
      [customerId],
    );
    return { success: true, data: res.rows };
  } catch (error) {
    return { success: false, err: String(error) };
  }
}

export async function getAppById(
  db: Db,
  customerId: string,
  appId: string,
): Promise<Result<App | null, string>> {
  return one<App>(
    db,
    "SELECT * FROM apps WHERE app_id = $1 AND customer_id = $2",
    [appId, customerId],
  );
}

export async function insertApp(
  db: Db,
  customerId: string,
  label: string,
  allowedOrigins: string[],
  secretHash: string | null,
): Promise<Result<App, string>> {
  const res = await one<App>(
    db,
    `INSERT INTO apps (customer_id, label, allowed_origins, secret_hash)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [customerId, label, allowedOrigins, secretHash],
  );
  if (!res.success) {
    return res;
  }
  return res.data
    ? { success: true, data: res.data }
    : { success: false, err: "insert returned no row" };
}

export interface AppUpdate {
  label?: string;
  allowed_origins?: string[];
  login_methods?: string[];
  accent_color?: string | null;
  theme_mode?: string;
  logo_url?: string | null;
  network?: string;
}

const UPDATABLE: (keyof AppUpdate)[] = [
  "label",
  "allowed_origins",
  "login_methods",
  "accent_color",
  "theme_mode",
  "logo_url",
  "network",
];

export async function updateApp(
  db: Db,
  customerId: string,
  appId: string,
  update: AppUpdate,
): Promise<Result<App | null, string>> {
  const sets: string[] = [];
  const args: unknown[] = [appId, customerId];
  for (const k of UPDATABLE) {
    if (update[k] !== undefined) {
      args.push(update[k]);
      sets.push(`${k} = $${args.length}`);
    }
  }
  if (sets.length === 0) {
    return getAppById(db, customerId, appId);
  }
  return one<App>(
    db,
    `UPDATE apps SET ${sets.join(", ")}, updated_at = now()
     WHERE app_id = $1 AND customer_id = $2 RETURNING *`,
    args,
  );
}

export async function setAppSecretHash(
  db: Db,
  customerId: string,
  appId: string,
  secretHash: string,
): Promise<Result<App | null, string>> {
  return one<App>(
    db,
    `UPDATE apps SET secret_hash = $3, updated_at = now()
     WHERE app_id = $1 AND customer_id = $2 RETURNING *`,
    [appId, customerId, secretHash],
  );
}

/**
 * The app an API key belongs to. Keys created before apps existed (or re-seeded) are
 * attached to the customer's first app, which is created from the customer if missing.
 */
export async function getAppForApiKey(
  db: Db,
  apiKey: string,
): Promise<Result<App | null, string>> {
  const keyRes = await one<{
    customer_id: string;
    app_id: string | null;
    is_active: boolean;
  }>(
    db,
    "SELECT customer_id, app_id, is_active FROM api_keys WHERE hashed_key = $1",
    [apiKey],
  );
  if (!keyRes.success || !keyRes.data || !keyRes.data.is_active) {
    return keyRes.success ? { success: true, data: null } : keyRes;
  }
  const { customer_id, app_id } = keyRes.data;
  if (app_id) {
    return getAppById(db, customer_id, app_id);
  }
  const apps = await getAppsByCustomerId(db, customer_id);
  if (!apps.success) {
    return apps;
  }
  let app: App | null = apps.data[0] ?? null;
  if (!app) {
    const created = await one<App>(
      db,
      `INSERT INTO apps (customer_id, label, allowed_origins, logo_url)
       SELECT customer_id, label,
              '{}'::text[],
              NULLIF(logo_url, '')
       FROM customers WHERE customer_id = $1 RETURNING *`,
      [customer_id],
    );
    if (!created.success) {
      return created;
    }
    app = created.data;
  }
  if (app) {
    await one(db, "UPDATE api_keys SET app_id = $1 WHERE hashed_key = $2", [
      app.app_id,
      apiKey,
    ]);
  }
  return { success: true, data: app };
}

export async function setApiKeyApp(
  db: Db,
  keyId: string,
  appId: string,
): Promise<Result<null, string>> {
  const res = await one(
    db,
    "UPDATE api_keys SET app_id = $2 WHERE key_id = $1",
    [keyId, appId],
  );
  return res.success ? { success: true, data: null } : res;
}

export interface AppUserRow {
  user_id: string;
  email: string | null;
  auth_type: string | null;
  public_key_ed25519: string | null;
  connected_at: Date;
  last_seen_at: Date;
}

/** Users who signed in to this customer's apps (Preview: per customer, not per app). */
export async function getAppUsers(
  db: Db,
  customerId: string,
  limit = 100,
): Promise<Result<AppUserRow[], string>> {
  try {
    const res = await db.query(
      `SELECT c.user_id, u.email, u.auth_type,
              encode(w.public_key, 'hex') AS public_key_ed25519,
              c.created_at AS connected_at, c.updated_at AS last_seen_at
       FROM bitcodex_user_customer_connections c
       LEFT JOIN bitcodex_users u ON u.user_id = c.user_id
       LEFT JOIN bitcodex_wallets w ON w.user_id = c.user_id AND w.curve_type = 'ed25519'
       WHERE c.customer_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2`,
      [customerId, limit],
    );
    return { success: true, data: res.rows };
  } catch (error) {
    return { success: false, err: String(error) };
  }
}
