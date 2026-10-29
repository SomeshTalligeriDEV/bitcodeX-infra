import type { Knex } from "knex";

// X11 developer dashboard: several apps per customer, each with its own API keys,
// allowed origins, login methods, theme and network. Existing API keys are attached
// to a default app per customer, so nothing that resolves a key to a customer changes.
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.withSchema("public").hasTable("apps"))) {
    await knex.schema.withSchema("public").createTable("apps", (table) => {
      table
        .uuid("app_id")
        .notNullable()
        .defaultTo(knex.raw("gen_random_uuid()"))
        .primary({ constraintName: "apps_pkey" });
      table.uuid("customer_id").notNullable();
      table.string("label", 128).notNullable();
      // Sites allowed to open the BitcodeX modal and request signatures. Empty = any.
      table
        .specificType("allowed_origins", "text[]")
        .notNullable()
        .defaultTo("{}");
      // Enabled login methods, in display order.
      table
        .specificType("login_methods", "text[]")
        .notNullable()
        .defaultTo(knex.raw("ARRAY['google','github']::text[]"));
      table.string("accent_color", 16);
      table.string("theme_mode", 16).notNullable().defaultTo("system");
      table.string("logo_url", 1024);
      table.string("network", 32).notNullable().defaultTo("bittensor:localnet");
      // sha256 hex of the app secret; the secret itself is shown once and never stored.
      table.string("secret_hash", 64);
      table
        .timestamp("created_at", { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table
        .timestamp("updated_at", { useTz: true })
        .notNullable()
        .defaultTo(knex.fn.now());
      table.index(["customer_id"], "idx_apps_customer_id");
    });
  }

  if (
    !(await knex.schema.withSchema("public").hasColumn("api_keys", "app_id"))
  ) {
    await knex.schema.withSchema("public").alterTable("api_keys", (table) => {
      table.uuid("app_id");
      table.index(["app_id"], "idx_api_keys_app_id");
    });
  }

  // Default app per existing customer, owning that customer's existing keys. It allows
  // any origin (the behaviour before apps existed); developers restrict it in the dashboard.
  await knex.raw(`
    INSERT INTO apps (customer_id, label, allowed_origins, logo_url)
    SELECT c.customer_id, c.label,
           '{}'::text[],
           NULLIF(c.logo_url, '')
    FROM customers c
    WHERE NOT EXISTS (SELECT 1 FROM apps a WHERE a.customer_id = c.customer_id)
  `);
  await knex.raw(`
    UPDATE api_keys k SET app_id = a.app_id
    FROM (
      SELECT DISTINCT ON (customer_id) customer_id, app_id
      FROM apps ORDER BY customer_id, created_at
    ) a
    WHERE k.customer_id = a.customer_id AND k.app_id IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.withSchema("public").hasColumn("api_keys", "app_id")) {
    await knex.schema.withSchema("public").alterTable("api_keys", (table) => {
      table.dropIndex(["app_id"], "idx_api_keys_app_id");
      table.dropColumn("app_id");
    });
  }
  await knex.schema.withSchema("public").dropTableIfExists("apps");
}
