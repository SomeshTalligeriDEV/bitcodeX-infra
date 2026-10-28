import { createDefaultEsmPreset } from "ts-jest";

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  ...createDefaultEsmPreset(),
  testEnvironment: "node",
  // Run tests serially to avoid port conflicts since tests share the same ports
  maxWorkers: 1,
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    "^@e2e/(.*)$": "<rootDir>/src/$1",
    "^@bitcodex-api/(.*)$": "<rootDir>/../backend/bitcodex_api/server/src/$1",
    "^@bitcodex-ksn-server/(.*)$": "<rootDir>/../key_share_node/server/src/$1",
    "^@bitcodex-types/(.*)$": "<rootDir>/../common/bitcodex_types/src/$1",
    "^@bitcodex-bitcodex-pg-interface/(.*)$":
      "<rootDir>/../backend/bitcodex_pg_interface/src/$1",
  },
  transformIgnorePatterns: ["node_modules/(?!(@bitcodex/.*)/)"],
};
