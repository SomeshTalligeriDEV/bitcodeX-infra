import type { Knex } from "knex";

// X12: TOTP before signing above a per-user limit. The secret is stored encrypted.
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.withSchema("public").hasTable("user_mfa"))) {
    await knex.schema.withSchema("public").createTable("user_mfa", (t) => {
      t.uuid("user_id").primary({ constraintName: "user_mfa_pkey" });
      t.text("totp_secret_enc").notNullable();
      t.boolean("enabled").notNullable().defaultTo(false);
      // Calls moving at least this many rao need a code; null = every signature.
      t.decimal("threshold_rao", 30, 0);
      t.timestamp("created_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
      t.timestamp("updated_at", { useTz: true }).notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.withSchema("public").dropTableIfExists("user_mfa");
}
