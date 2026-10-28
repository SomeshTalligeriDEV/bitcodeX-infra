/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { useESM: true, tsconfig: "tsconfig.json" }],
  },
  testEnvironment: "node",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testTimeout: 120000,
  moduleNameMapper: {
    "^@bitcodex-bittensor-chain/(.*)$": "<rootDir>/src/$1",
  },
};
