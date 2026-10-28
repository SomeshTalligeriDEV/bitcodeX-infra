import type { PgDatabaseConfig } from "@bitcodex/postgres-lib";

export const testPgConfig: PgDatabaseConfig = {
  database: "bitcodex_dev",
  host: "localhost",
  password: "postgres",
  user: "postgres",
  port: 5432,
  ssl: false,
};
