import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  const tableExists = await knex.schema
    .withSchema("public")
    .hasTable("bitcodex_user_customer_connections");

  if (!tableExists) {
    await knex.schema
      .withSchema("public")
      .createTable("bitcodex_user_customer_connections", (table) => {
        table
          .uuid("connection_id")
          .notNullable()
          .defaultTo(knex.raw("gen_random_uuid()"))
          .primary({
            constraintName: "bitcodex_user_customer_connections_pkey",
          });
        table.uuid("user_id").notNullable();
        table.uuid("customer_id").notNullable();
        table.string("state", 32).notNullable();
        table
          .timestamp("created_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());
        table
          .timestamp("updated_at", { useTz: true })
          .notNullable()
          .defaultTo(knex.fn.now());

        table.unique(["user_id", "customer_id"], {
          indexName: "bitcodex_user_customer_connections_user_customer_key",
        });
        table.index(
          ["user_id"],
          "idx_bitcodex_user_customer_connections_user_id",
        );
      });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .withSchema("public")
    .dropTableIfExists("bitcodex_user_customer_connections");
}
