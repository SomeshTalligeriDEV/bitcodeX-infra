import type { Knex } from "knex";

// X04 wallet login (Sign-In with Bittensor from an extension) and linked accounts.
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.withSchema("public").hasTable("wallet_login_nonces"))) {
    await knex.schema.withSchema("public").createTable("wallet_login_nonces", (t) => {
      t.string("nonce", 64).primary({ constraintName: "wallet_login_nonces_pkey" });
      t.string("address", 64).notNullable();
      t.uuid("app_id").notNullable();
      t.timestamp("expires_at", { useTz: true }).notNullable();
      // Set when the nonce is consumed: every nonce verifies at most once.
      t.timestamp("used_at", { useTz: true });
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
  }
  if (!(await knex.schema.withSchema("public").hasTable("linked_accounts"))) {
    await knex.schema.withSchema("public").createTable("linked_accounts", (t) => {
      t.uuid("id").notNullable().defaultTo(knex.raw("gen_random_uuid()")).primary({ constraintName: "linked_accounts_pkey" });
      t.uuid("user_id").notNullable();
      // "wallet" (SS58 address verified by Sign-In with Bittensor).
      t.string("type", 32).notNullable();
      t.string("subject", 255).notNullable();
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      t.unique(["type", "subject"], { indexName: "linked_accounts_type_subject_key" });
      t.index(["user_id"], "idx_linked_accounts_user_id");
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema("public").dropTableIfExists("linked_accounts");
  await knex.schema.withSchema("public").dropTableIfExists("wallet_login_nonces");
}
