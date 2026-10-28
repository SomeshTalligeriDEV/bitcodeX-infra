import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable("ewallet_users", "bitcodex_users");
  await knex.schema.renameTable("ewallet_wallets", "bitcodex_wallets");

  await knex.raw(`
    ALTER TABLE bitcodex_users RENAME CONSTRAINT ewallet_users_pkey TO bitcodex_users_pkey;
    ALTER TABLE bitcodex_users RENAME CONSTRAINT ewallet_users_email_auth_type_key TO bitcodex_users_email_auth_type_key;
    ALTER TABLE bitcodex_wallets RENAME CONSTRAINT ewallet_wallets_pkey TO bitcodex_wallets_pkey;
    ALTER TABLE bitcodex_wallets RENAME CONSTRAINT ewallet_wallets_public_key_key TO bitcodex_wallets_public_key_key;
  `);

  await knex.raw(`
    ALTER INDEX idx_ewallet_wallets_created_at RENAME TO idx_bitcodex_wallets_created_at;
    ALTER INDEX idx_ewallet_wallets_user_id_curve_type_status RENAME TO idx_bitcodex_wallets_user_id_curve_type_status;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER INDEX idx_bitcodex_wallets_created_at RENAME TO idx_ewallet_wallets_created_at;
    ALTER INDEX idx_bitcodex_wallets_user_id_curve_type_status RENAME TO idx_ewallet_wallets_user_id_curve_type_status;
  `);

  await knex.raw(`
    ALTER TABLE bitcodex_users RENAME CONSTRAINT bitcodex_users_pkey TO ewallet_users_pkey;
    ALTER TABLE bitcodex_users RENAME CONSTRAINT bitcodex_users_email_auth_type_key TO ewallet_users_email_auth_type_key;
    ALTER TABLE bitcodex_wallets RENAME CONSTRAINT bitcodex_wallets_pkey TO ewallet_wallets_pkey;
    ALTER TABLE bitcodex_wallets RENAME CONSTRAINT bitcodex_wallets_public_key_key TO ewallet_wallets_public_key_key;
  `);

  await knex.schema.renameTable("bitcodex_users", "ewallet_users");
  await knex.schema.renameTable("bitcodex_wallets", "ewallet_wallets");
}
