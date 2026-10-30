# @adityaghgh/sdk-core

Core of the BitcodeX embedded wallet: loads the BitcodeX iframe, runs login (Google,
GitHub), and carries signing requests to the iframe, the only place keys are used.
You normally use it through `@adityaghgh/sdk-bittensor` or `@adityaghgh/sdk-react`.

Types for the EVM/Cosmos signing payloads reference `viem`, `@keplr-wallet/types` and
`@cosmjs/amino` (optional peer dependencies). Bittensor apps do not need them; use
`skipLibCheck: true` (the Next.js default) or install them.
