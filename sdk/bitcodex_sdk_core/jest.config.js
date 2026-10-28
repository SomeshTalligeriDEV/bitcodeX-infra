/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testEnvironment: "node",
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  moduleNameMapper: {
    "^@bitcodex-sdk-cosmos/(.*)$": "<rootDir>/src/$1",
    "^@bitcodex-sdk-core/(.*)$": "<rootDir>/../bitcodex_sdk_core/src/$1",
  },
  setupFilesAfterEnv: [],
};
