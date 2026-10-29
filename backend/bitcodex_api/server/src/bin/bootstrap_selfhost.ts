// Self-host bootstrap (docker-compose.selfhost.yml). Idempotent; never uses the dev
// seed's known passwords. First run: registers the key share nodes, enables TSS, creates
// one developer account (random password) and one app (API key + secret), and prints
// the secrets ONCE. Later runs print only the app ID and API key.
//
// Env: DB_*, BITCODEX_KSN_PUBLIC_URLS (comma), BITCODEX_APP_LABEL, BITCODEX_APP_ORIGINS
// (comma), BITCODEX_NETWORK, BITCODEX_ADMIN_EMAIL.
import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "@bitcodex/crypto-js";
import pg from "pg";

const env = (k: string, d?: string) => {
  const v = process.env[k] ?? d;
  if (v === undefined || v === "") {
    throw new Error(`${k} is required`);
  }
  return v;
};

async function main() {
  const db = new pg.Pool({
    host: env("DB_HOST"),
    port: Number(env("DB_PORT", "5432")),
    user: env("DB_USER"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME"),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });
  const ksnUrls = env("BITCODEX_KSN_PUBLIC_URLS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const network = env("BITCODEX_NETWORK", "bittensor:testnet");
  if (network !== "bittensor:testnet" && network !== "bittensor:localnet") {
    throw new Error(
      "BITCODEX_NETWORK must be bittensor:testnet or bittensor:localnet",
    );
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const meta = await client.query(
      "SELECT 1 FROM key_share_node_meta LIMIT 1",
    );
    if (meta.rowCount === 0) {
      await client.query(
        "INSERT INTO key_share_node_meta (meta_id, sss_threshold) VALUES (gen_random_uuid(), 2)",
      );
    }
    for (const [i, url] of ksnUrls.entries()) {
      await client.query(
        `INSERT INTO key_share_nodes (node_id, node_name, server_url, status)
         SELECT gen_random_uuid(), $1::varchar, $2::varchar, 'ACTIVE'
         WHERE NOT EXISTS (
           SELECT 1 FROM key_share_nodes WHERE server_url = $2::varchar AND deleted_at IS NULL
         )`,
        [`ks_node_${i + 1}`, url],
      );
    }
    await client.query(
      `INSERT INTO tss_activation_settings (activation_key, is_enabled, description, updated_at)
       SELECT 'tss_all', true, 'Master switch for all TSS operations', now()
       WHERE NOT EXISTS (SELECT 1 FROM tss_activation_settings WHERE activation_key = 'tss_all')`,
    );

    const existing = await client.query(
      `SELECT a.app_id, k.hashed_key AS api_key FROM apps a
       JOIN api_keys k ON k.app_id = a.app_id
       ORDER BY a.created_at LIMIT 1`,
    );
    if (existing.rowCount && existing.rowCount > 0) {
      await client.query("COMMIT");
      console.log(
        "Already bootstrapped (secrets were shown on the first run only).",
      );
      console.log(`App ID:  ${existing.rows[0].app_id}`);
      console.log(`API key: ${existing.rows[0].api_key}`);
      return;
    }

    const label = env("BITCODEX_APP_LABEL", "My BitcodeX app");
    const origins = (process.env.BITCODEX_APP_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const email = env("BITCODEX_ADMIN_EMAIL", "admin@bitcodex.local");
    const password = randomBytes(12).toString("base64url");
    const apiKey = randomBytes(32).toString("hex");
    const secret = `bcx_sk_${randomBytes(32).toString("hex")}`;

    const customer = await client.query(
      `INSERT INTO customers (customer_id, label, status, url)
       VALUES (gen_random_uuid(), $1, 'ACTIVE', $2) RETURNING customer_id`,
      [label, origins[0] ?? null],
    );
    const customerId = customer.rows[0].customer_id;
    await client.query(
      `INSERT INTO customer_dashboard_users
         (user_id, customer_id, status, email, is_email_verified, email_verified_at, password_hash, role)
       VALUES (gen_random_uuid(), $1, 'ACTIVE', $2, true, now(), $3, 'admin')`,
      [customerId, email, await hashPassword(password)],
    );
    const app = await client.query(
      `INSERT INTO apps (customer_id, label, allowed_origins, network, secret_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING app_id`,
      [
        customerId,
        label,
        origins,
        network,
        createHash("sha256").update(secret).digest("hex"),
      ],
    );
    const appId = app.rows[0].app_id;
    await client.query(
      `INSERT INTO api_keys (key_id, customer_id, hashed_key, app_id)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [customerId, apiKey, appId],
    );
    await client.query("COMMIT");

    console.log(
      "BitcodeX is bootstrapped. Save these now; the secret and password are shown ONCE.",
    );
    console.log(`App ID:      ${appId}`);
    console.log(`API key:     ${apiKey}`);
    console.log(`App secret:  ${secret}`);
    console.log(`Dashboard:   ${email} / ${password}`);
    console.log(`Network:     ${network}`);
    console.log(
      `Origins:     ${origins.length ? origins.join(", ") : "(any)"}`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await db.end();
  }
}

main().catch((err) => {
  console.error(
    `bootstrap failed: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
});
