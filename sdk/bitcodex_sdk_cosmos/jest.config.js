/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  testTimeout: 60000,
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/", "<rootDir>/dist-test/"],
  moduleNameMapper: {
    "^@bitcodex-sdk-cosmos/(.*)$": "<rootDir>/src/$1",
    "^@bitcodex-sdk-core/(.*)$": "<rootDir>/../bitcodex_sdk_core/src/$1",
  },
  setupFilesAfterEnv: [],
};
